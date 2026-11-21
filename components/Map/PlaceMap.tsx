"use client";
// Candidate pins with drag-to-adjust (R2). Leaflet + OpenStreetMap tiles, loaded client-side only.
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type Pin = { name: string; address: string; lat: number; lng: number };

export default function PlaceMap({ pins, selected, onSelect, onMove }: {
  pins: Pin[]; selected: number | null;
  onSelect: (i: number) => void; onMove: (i: number, lat: number, lng: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      if (!map.current) {
        map.current = L.map(el.current, { zoomControl: false }).setView([27.97, -82.8], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
      }
      layer.current.clearLayers();
      const icon = (on: boolean) => L.divIcon({ className: "", iconSize: [22, 22], iconAnchor: [11, 22],
        html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${on ? "#b8892e" : "#333"};border:2px solid #fff;box-shadow:0 1px 4px #0006"></div>` });
      pins.forEach((p, i) => {
        const m = L.marker([p.lat, p.lng], { draggable: true, icon: icon(i === selected) }).addTo(layer.current);
        m.bindTooltip(p.name);
        m.on("click", () => onSelect(i));
        m.on("dragend", () => { const ll = m.getLatLng(); onMove(i, ll.lat, ll.lng); });
      });
      if (pins.length) {
        const b = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
        map.current.fitBounds(b, { padding: [40, 40], maxZoom: 17 });
      }
    })();
    return () => { cancelled = true; };
  }, [pins, selected, onSelect, onMove]);

  return <div ref={el} style={{ height: 260, borderRadius: 12, overflow: "hidden" }} />;
}
