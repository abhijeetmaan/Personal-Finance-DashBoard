import { NavLink } from "react-router-dom";

function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <h1 className="brand">Finova</h1>
        <nav className="main-nav" aria-label="Main Navigation">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            end
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/add"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Add Transaction
          </NavLink>
          <NavLink
            to="/accounts"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Accounts
          </NavLink>
          <NavLink
            to="/cards"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Cards
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;
