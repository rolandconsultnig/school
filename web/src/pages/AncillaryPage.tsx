import { FormEvent, useEffect, useState } from "react";
import { ancillaryApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { PageHeader } from "../components/PageHeader";
import { recordId, type ApiRecord } from "../types";

export function AncillaryPage() {
  const ctx = useApiContext();
  const [tab, setTab] = useState<"transport" | "cafeteria">("transport");
  const [routes, setRoutes] = useState<ApiRecord[]>([]);
  const [menus, setMenus] = useState<ApiRecord[]>([]);
  const [routeName, setRouteName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [gpsRouteId, setGpsRouteId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [menuDate, setMenuDate] = useState(new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState("LUNCH");
  const [menuItems, setMenuItems] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    Promise.all([
      ancillaryApi.transportRoutes(ctx.token, ctx.campusId, ctx.tier),
      ancillaryApi.cafeteriaMenus(ctx.token, ctx.campusId, ctx.tier),
    ])
      .then(([r, m]) => {
        setRoutes(r as ApiRecord[]);
        setMenus(m as ApiRecord[]);
        if (r[0] && !gpsRouteId) setGpsRouteId(recordId(r[0] as ApiRecord));
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    load();
  }, [ctx.token, ctx.campusId, ctx.tier]);

  async function addRoute(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await ancillaryApi.createTransportRoute(
        ctx.token,
        {
          name: routeName,
          driverName,
          vehiclePlate,
          campusId: ctx.campusId,
        },
        ctx.campusId,
        ctx.tier
      );
      setRouteName("");
      setDriverName("");
      setVehiclePlate("");
      setMsg("Transport route created.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function updateGps(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await ancillaryApi.updateRouteGps(
        ctx.token,
        gpsRouteId,
        { latitude: Number(latitude), longitude: Number(longitude) },
        ctx.campusId,
        ctx.tier
      );
      setMsg("GPS position updated.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  async function addMenu(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await ancillaryApi.createCafeteriaMenu(
        ctx.token,
        {
          campusId: ctx.campusId,
          menuDate,
          mealType,
          items: menuItems,
        },
        ctx.campusId,
        ctx.tier
      );
      setMenuItems("");
      setMsg("Cafeteria menu added.");
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <PageHeader title="Transport & cafeteria" subtitle="Module 11 — campus services" />
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="portal-tabs" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={tab === "transport" ? "active" : ""}
          onClick={() => setTab("transport")}
        >
          Transport
        </button>
        <button
          type="button"
          className={tab === "cafeteria" ? "active" : ""}
          onClick={() => setTab("cafeteria")}
        >
          Cafeteria
        </button>
      </div>
      {tab === "transport" ? (
        <div className="grid-2">
          <form className="card" onSubmit={addRoute}>
            <h3>New route</h3>
            <div className="form-group">
              <label>Route name</label>
              <input value={routeName} onChange={(e) => setRouteName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Driver</label>
              <input value={driverName} onChange={(e) => setDriverName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Vehicle plate</label>
              <input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
            </div>
            <button type="submit" className="btn">
              Add route
            </button>
          </form>
          <div>
            <form className="card" onSubmit={updateGps} style={{ marginBottom: "1rem" }}>
              <h3>Update bus GPS</h3>
              <div className="form-group">
                <label>Route</label>
                <select value={gpsRouteId} onChange={(e) => setGpsRouteId(e.target.value)} required>
                  {routes.map((r) => (
                    <option key={recordId(r)} value={recordId(r)}>
                      {String(r.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary">
                Publish position
              </button>
            </form>
            <div className="card">
              <h3>Routes ({routes.length})</h3>
              <ul>
                {routes.map((r) => (
                  <li key={recordId(r)}>
                    <strong>{String(r.name)}</strong> — {String(r.driverName ?? "—")} (
                    {String(r.vehiclePlate ?? "—")})
                    {r.lastLatitude != null && (
                      <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                        {" "}
                        · GPS {Number(r.lastLatitude).toFixed(4)}, {Number(r.lastLongitude).toFixed(4)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {routes.length === 0 && <p className="empty">No routes yet</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          <form className="card" onSubmit={addMenu}>
            <h3>New menu</h3>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={menuDate}
                onChange={(e) => setMenuDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Meal</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="SNACK">Snack</option>
              </select>
            </div>
            <div className="form-group">
              <label>Items</label>
              <textarea
                value={menuItems}
                onChange={(e) => setMenuItems(e.target.value)}
                required
                rows={3}
              />
            </div>
            <button type="submit" className="btn">
              Publish menu
            </button>
          </form>
          <div className="card table-wrap">
            <h3>Menus</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Meal</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => (
                  <tr key={recordId(m)}>
                    <td>{String(m.menuDate ?? "").slice(0, 10)}</td>
                    <td>{String(m.mealType)}</td>
                    <td>{String(m.items)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {menus.length === 0 && <p className="empty">No menus</p>}
          </div>
        </div>
      )}
    </div>
  );
}
