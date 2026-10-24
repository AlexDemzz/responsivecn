import { Link } from "@tanstack/react-router"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Tab-styled links that switch the same component between its Base UI and
// Radix page. The tabs don't swap content — each is a link to the other base.
export function DocsBaseTabs({
  base,
  component,
}: {
  base: "base" | "radix"
  component: string
}) {
  return (
    <Tabs value={base} className="not-prose mb-6">
      <TabsList variant="line">
        <TabsTrigger
          value="base"
          nativeButton={false}
          render={
            <Link to="/docs/$" params={{ _splat: `base/${component}` }} />
          }
        >
          Base UI
        </TabsTrigger>
        <TabsTrigger
          value="radix"
          nativeButton={false}
          render={
            <Link to="/docs/$" params={{ _splat: `radix/${component}` }} />
          }
        >
          Radix
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
