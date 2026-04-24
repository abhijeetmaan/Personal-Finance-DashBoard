import { Transaction } from "../models/Transaction.js";

const MAX_MONTHS = 6;

const roundTo2 = (value) => Number(value.toFixed(2));

const computeSimpleMovingAverage = (series) => {
  if (!series.length) return 0;
  const sum = series.reduce((acc, value) => acc + value, 0);
  return sum / series.length;
};

const computeWeightedAverage = (series) => {
  if (!series.length) return 0;

  const weights = series.map((_, idx) => idx + 1);
  const weightedSum = series.reduce(
    (acc, value, idx) => acc + value * weights[idx],
    0,
  );
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);

  return weightedSum / totalWeight;
};

const createMonthWindows = (monthsBack = MAX_MONTHS) => {
  const monthWindows = [];
  const currentUtcDate = new Date();
  const currentMonthStart = new Date(
    Date.UTC(currentUtcDate.getUTCFullYear(), currentUtcDate.getUTCMonth(), 1),
  );

  for (let i = monthsBack; i >= 1; i -= 1) {
    const start = new Date(
      Date.UTC(
        currentMonthStart.getUTCFullYear(),
        currentMonthStart.getUTCMonth() - i,
        1,
      ),
    );
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );

    monthWindows.push({
      start,
      end,
      key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    });
  }

  return monthWindows;
};

const buildMonthlySeries = (monthWindows, groupedRows) => {
  const bucketByMonth = new Map(
    monthWindows.map((window) => [window.key, { total: 0, categories: {} }]),
  );

  groupedRows.forEach((row) => {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    const bucket = bucketByMonth.get(key);

    if (!bucket) return;

    bucket.total += row.amount;
    bucket.categories[row._id.category] =
      (bucket.categories[row._id.category] || 0) + row.amount;
  });

  const totalsSeries = [];
  const categorySeriesMap = {};

  monthWindows.forEach((window) => {
    const bucket = bucketByMonth.get(window.key);
    totalsSeries.push(bucket.total);

    Object.entries(bucket.categories).forEach(([category, value]) => {
      if (!categorySeriesMap[category]) {
        categorySeriesMap[category] = new Array(monthWindows.length).fill(0);
      }
      categorySeriesMap[category][totalsSeries.length - 1] = value;
    });
  });

  return { totalsSeries, categorySeriesMap };
};

const predictFromSeries = (series) => {
  const sma = computeSimpleMovingAverage(series);
  const wma = computeWeightedAverage(series);

  // Blend both strategies so outliers are tempered while still favoring recent behavior.
  return (sma + wma) / 2;
};

const buildCategoryForecast = (categorySeriesMap) => {
  return Object.entries(categorySeriesMap).reduce(
    (acc, [category, series]) => {
      const normalizedCategory = category.toLowerCase();
      const predicted = roundTo2(predictFromSeries(series));
      const lastObserved = roundTo2(series[series.length - 1] || 0);

      acc.categoryPrediction[normalizedCategory] = predicted;
      acc.categoryTrends[normalizedCategory] =
        predicted > lastObserved
          ? "up"
          : predicted < lastObserved
            ? "down"
            : "stable";

      return acc;
    },
    {
      categoryPrediction: {},
      categoryTrends: {},
    },
  );
};

export const predictionService = {
  async predictNextMonthExpenses() {
    const monthWindows = createMonthWindows(MAX_MONTHS);
    const startDate = monthWindows[0].start;
    const endDate = monthWindows[monthWindows.length - 1].end;

    const groupedRows = await Transaction.aggregate([
      {
        $match: {
          type: "expense",
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            category: "$category",
          },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const { totalsSeries, categorySeriesMap } = buildMonthlySeries(
      monthWindows,
      groupedRows,
    );

    const totalPrediction = roundTo2(predictFromSeries(totalsSeries));

    const { categoryPrediction, categoryTrends } =
      buildCategoryForecast(categorySeriesMap);

    return {
      totalPrediction,
      categoryPrediction,
      categoryTrends,
    };
  },

  async predictCategorySpending() {
    const monthWindows = createMonthWindows(MAX_MONTHS);
    const startDate = monthWindows[0].start;
    const endDate = monthWindows[monthWindows.length - 1].end;

    const groupedRows = await Transaction.aggregate([
      {
        $match: {
          type: "expense",
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            category: "$category",
          },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const { categorySeriesMap } = buildMonthlySeries(monthWindows, groupedRows);
    const { categoryPrediction, categoryTrends } =
      buildCategoryForecast(categorySeriesMap);

    return {
      categoryPrediction,
      categoryTrends,
    };
  },
};
