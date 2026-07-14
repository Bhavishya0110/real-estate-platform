"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * BRD Home blueprint §02 — smart search: Type / BHK / Budget / Location.
 *
 * Submits to /projects as query params. The listing page (next milestone) reads
 * them as its initial filter state, so the search is already wired end-to-end.
 */

const ANY = "any";

const types = [
  { value: ANY, label: "Any type" },
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Plots", label: "Plots" },
  { value: "Senior Living", label: "Senior Living" },
  { value: "Luxury", label: "Luxury" },
];

const bhks = [
  { value: ANY, label: "Any BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4 BHK+" },
];

const budgets = [
  { value: ANY, label: "Any budget" },
  { value: "5000000", label: "Under ₹50 L" },
  { value: "10000000", label: "Under ₹1 Cr" },
  { value: "25000000", label: "Under ₹2.5 Cr" },
  { value: "100000000", label: "₹2.5 Cr+" },
];

const locations = [
  { value: ANY, label: "Any location" },
  { value: "Pune", label: "Pune" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Satara", label: "Satara" },
];

export function HeroSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    type: ANY,
    bhk: ANY,
    budget: ANY,
    city: ANY,
  });

  function update(key: keyof typeof filters) {
    return (event: React.ChangeEvent<HTMLSelectElement>) =>
      setFilters((current) => ({ ...current, [key]: event.target.value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== ANY) params.set(key, value);
    }

    const query = params.toString();
    router.push(query ? `/projects?${query}` : "/projects");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-sm border border-white/10 bg-navy-950/60 p-4 backdrop-blur-md sm:p-6 lg:p-7",
        className,
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-[repeat(4,1fr)_auto] lg:items-end">
        <Select
          label="Property Type"
          options={types}
          value={filters.type}
          onChange={update("type")}
        />
        <Select
          label="Configuration"
          options={bhks}
          value={filters.bhk}
          onChange={update("bhk")}
        />
        <Select
          label="Budget"
          options={budgets}
          value={filters.budget}
          onChange={update("budget")}
        />
        <Select
          label="Location"
          options={locations}
          value={filters.city}
          onChange={update("city")}
        />

        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="h-12 w-full sm:col-span-2 lg:col-span-1 lg:w-auto"
        >
          <Search className="size-4" aria-hidden="true" />
          Search
        </Button>
      </div>
    </form>
  );
}
