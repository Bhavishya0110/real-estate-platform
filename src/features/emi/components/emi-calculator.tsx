"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { calculateEmi } from "../lib/emi";

/**
 * BRD Home blueprint §07 — EMI Calculator:
 * Amount → Tenure → Rate → instant result, slider inputs, no page reload.
 * CTAs: Check Full EMI · Apply.
 *
 * Reusable: the same component is dropped onto /emi-calculator and the project
 * detail pages, optionally seeded with that project's starting price.
 */
export function EmiCalculator({
  defaultPrincipal = 7500000,
  compact = false,
}: {
  defaultPrincipal?: number;
  compact?: boolean;
}) {
  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const emi = useMemo(
    () =>
      calculateEmi({
        principal,
        annualRatePercent: rate,
        tenureYears: years,
      }),
    [principal, rate, years],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      {/* --- Inputs -------------------------------------------------------- */}
      <div className="flex flex-col gap-7 sm:gap-8">
        <Slider
          id="emi-principal"
          label="Loan Amount"
          valueLabel={formatCompactCurrency(principal)}
          min={500000}
          max={100000000}
          step={100000}
          value={principal}
          onChange={(event) => setPrincipal(Number(event.target.value))}
        />

        <Slider
          id="emi-rate"
          label="Interest Rate"
          valueLabel={`${rate.toFixed(2)} %`}
          min={5}
          max={15}
          step={0.05}
          value={rate}
          onChange={(event) => setRate(Number(event.target.value))}
        />

        <Slider
          id="emi-tenure"
          label="Loan Tenure"
          valueLabel={`${years} ${years === 1 ? "year" : "years"}`}
          min={1}
          max={30}
          step={1}
          value={years}
          onChange={(event) => setYears(Number(event.target.value))}
        />

        {!compact ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Indicative only. Actual EMI depends on the lender&apos;s credit
            assessment, processing fees and the rate on your sanction letter.
          </p>
        ) : null}
      </div>

      {/* --- Result -------------------------------------------------------- */}
      <div className="flex flex-col justify-between rounded-sm bg-navy-900 p-6 sm:p-8 lg:p-10">
        <div>
          <p className="eyebrow text-gold-500">Your Monthly EMI</p>

          {/* aria-live so screen-reader users hear the recalculated figure. */}
          <p
            aria-live="polite"
            className="mt-3 font-display text-[2rem] break-words text-white sm:text-4xl lg:text-5xl"
          >
            {formatCurrency(emi.monthlyEmi)}
          </p>

          <dl className="mt-8 space-y-4 border-t border-white/10 pt-6 sm:mt-10 sm:pt-8">
            <Row label="Principal" value={formatCurrency(principal)} />
            <Row
              label="Total Interest"
              value={formatCurrency(emi.totalInterest)}
              accent
            />
            <Row
              label="Total Payable"
              value={formatCurrency(emi.totalPayable)}
            />
          </dl>

          {/* Principal vs interest split */}
          <div className="mt-8">
            <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="bg-white/70"
                style={{ width: `${(1 - emi.interestShare) * 100}%` }}
              />
              <div
                className="bg-gold-500"
                style={{ width: `${emi.interestShare * 100}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-navy-300">
              Interest is{" "}
              <span className="font-semibold text-gold-500">
                {Math.round(emi.interestShare * 100)}%
              </span>{" "}
              of everything you will repay.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button href="/emi-calculator" variant="gold" size="md" className="flex-1">
            Check Full EMI
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>

          <Button
            href={whatsappUrl(
              `Hi JMS Group, I'd like home-loan assistance. My indicative EMI is ${formatCurrency(emi.monthlyEmi)} per month.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            variant="onDark"
            size="md"
            className="flex-1"
          >
            <WhatsAppIcon className="size-4" />
            Apply Now
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 sm:gap-4">
      <dt className="shrink-0 text-xs text-navy-300 sm:text-sm">{label}</dt>
      <dd
        className={`text-right font-display text-base tabular-nums sm:text-lg ${accent ? "text-gold-500" : "text-white"}`}
      >
        {value}
      </dd>
    </div>
  );
}
