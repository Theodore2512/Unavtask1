"use client";

import { useMemo, useState } from "react";
import { Field } from "@/components/field";
import { NativeSelect } from "@/components/ui/native-select";

export type CityOption = { id: string; name: string };
export type SchoolOption = {
  id: string;
  city_id: string;
  name: string;
  campus: string;
  email_domains: string[];
};

/** Choix de la ville, puis des seules écoles/campus de cette ville. */
export function SchoolPicker({
  cities,
  schools,
  onSchoolChange,
}: {
  cities: CityOption[];
  schools: SchoolOption[];
  onSchoolChange?: (school: SchoolOption | null) => void;
}) {
  const [cityId, setCityId] = useState("");
  const [schoolId, setSchoolId] = useState("");

  const filtered = useMemo(
    () =>
      schools
        .filter((s) => s.city_id === cityId)
        .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [schools, cityId],
  );
  const selected = filtered.find((s) => s.id === schoolId) ?? null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Ville" htmlFor="city_id">
        <NativeSelect
          id="city_id"
          value={cityId}
          required
          onChange={(e) => {
            setCityId(e.target.value);
            setSchoolId("");
            onSchoolChange?.(null);
          }}
        >
          <option value="" disabled>
            Choisir une ville
          </option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field
        label="École & campus"
        htmlFor="school_id"
        hint={selected ? `Email accepté : @${selected.email_domains.join(", @")}` : undefined}
      >
        <NativeSelect
          id="school_id"
          name="school_id"
          value={schoolId}
          required
          disabled={!cityId}
          onChange={(e) => {
            setSchoolId(e.target.value);
            onSchoolChange?.(filtered.find((s) => s.id === e.target.value) ?? null);
          }}
        >
          <option value="" disabled>
            {cityId ? "Choisir ton école" : "Choisis d'abord une ville"}
          </option>
          {filtered.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.campus}
            </option>
          ))}
        </NativeSelect>
      </Field>
    </div>
  );
}
