import { useCallback, useEffect, useState } from "react";
import { cardsService } from "../features/cards/services/cardsService";

export function useCards() {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCards = useCallback(async (options = {}) => {
    setIsLoading(true);

    try {
      const items = await cardsService.getCards(options);
      const nextCards = Array.isArray(items) ? items : [];
      setCards(nextCards);
      return nextCards;
    } catch {
      setCards([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCards();
  }, [refreshCards]);

  const addCard = useCallback(async (payload) => {
    const created = await cardsService.createCard(payload);
    setCards((current) =>
      [...current, created].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
    return created;
  }, []);

  const payBill = useCallback(async (payload) => {
    const updated = await cardsService.payBill(payload);
    setCards((current) =>
      current.map((card) => (card._id === updated._id ? updated : card)),
    );
    return updated;
  }, []);

  const deleteCard = useCallback(async (id, options = {}) => {
    const updated = await cardsService.deleteCard(id, options);
    setCards((current) => current.filter((item) => item._id !== id));
    return updated;
  }, []);

  return { cards, isLoading, refreshCards, addCard, payBill, deleteCard };
}
