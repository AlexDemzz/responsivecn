import { useState } from "react";
import { Switcher, type VariantDef } from "./Switcher";
import { VariantA } from "./variants/VariantA";
import { VariantB } from "./variants/VariantB";
import { VariantC } from "./variants/VariantC";

// PROTOTYPE — three variants of the /create page, switchable via ?variant=.
const VARIANTS: VariantDef[] = [
  { key: "a", name: "Two selects, strict matrix", render: () => <VariantA /> },
  { key: "b", name: "Pair rail + code panel", render: () => <VariantB /> },
  { key: "c", name: "Playground, derived mobile", render: () => <VariantC /> },
];

export function App() {
  const [variant, setVariant] = useState(
    () => new URLSearchParams(window.location.search).get("variant") ?? "a",
  );

  const change = (key: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", key);
    window.history.replaceState(null, "", url);
    setVariant(key);
  };

  const active = VARIANTS.find((v) => v.key === variant) ?? VARIANTS[0];

  return (
    <>
      {active.render()}
      <Switcher variants={VARIANTS} current={active.key} onChange={change} />
    </>
  );
}
