import { useEffect, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

type LiveGps = {
  routeId: string;
  routeName: string;
  latitude: number;
  longitude: number;
  updatedAt?: string;
};

export function StudentTransportPage() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<ApiRecord[]>([]);
  const [liveGps, setLiveGps] = useState<LiveGps | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    studentPortalApi
      .transport(user.token)
      .then((d) => {
        setRoutes(d.routes as ApiRecord[]);
        setLiveGps((d.liveGps as LiveGps | null) ?? null);
        setNote(d.note ?? "");
      })
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  const mapUrl =
    liveGps != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${liveGps.longitude - 0.02}%2C${liveGps.latitude - 0.02}%2C${liveGps.longitude + 0.02}%2C${liveGps.latitude + 0.02}&layer=mapnik&marker=${liveGps.latitude}%2C${liveGps.longitude}`
      : null;

  return (
    <div>
      <PageHeader title="Bus tracker" subtitle="School transport routes" />
      {error && <div className="error-banner">{error}</div>}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          {liveGps
            ? `Live position for ${liveGps.routeName}`
            : "Waiting for GPS update from your school transport team."}
        </p>
        {mapUrl ? (
          <iframe
            title="Bus location"
            src={mapUrl}
            style={{
              width: "100%",
              height: 280,
              border: 0,
              borderRadius: "var(--radius)",
              marginTop: "1rem",
            }}
          />
        ) : (
          <div
            style={{
              background: "var(--surface-muted)",
              borderRadius: "var(--radius)",
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "1rem",
              color: "var(--muted)",
            }}
          >
            Map will appear when GPS is available
          </div>
        )}
        {liveGps?.updatedAt && (
          <p style={{ fontSize: "0.85rem", marginTop: "0.75rem", color: "var(--muted)" }}>
            Last update: {String(liveGps.updatedAt).slice(0, 19)}
          </p>
        )}
        {note && <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{note}</p>}
      </div>
      <div className="grid-2">
        {routes.map((r) => (
          <div key={recordId(r)} className="card">
            <h3>{String(r.name)}</h3>
            <p>Driver: {String(r.driverName ?? "—")}</p>
            <p>Vehicle: {String(r.vehiclePlate ?? "—")}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              Stops: {String(r.stops ?? "—")}
            </p>
            {r.lastLatitude != null && (
              <p style={{ fontSize: "0.85rem" }}>
                GPS: {Number(r.lastLatitude).toFixed(4)}, {Number(r.lastLongitude).toFixed(4)}
              </p>
            )}
          </div>
        ))}
      </div>
      {routes.length === 0 && !error && <p className="empty">No routes for your campus</p>}
    </div>
  );
}
