import defaultMdxComponents from "fumadocs-ui/mdx"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import type { MDXComponents } from "mdx/types"
import { DocsBaseTabs } from "@/components/docs-base-tabs"
import {
  ComponentDemo,
  ComponentDemoCode,
  ComponentDemoRender,
} from "@/components/component-demo"
import { DialogDrawerPreview } from "@/components/previews/dialog-drawer-preview"
import { PopoverDrawerPreview } from "@/components/previews/popover-drawer-preview"
import { SheetDrawerPreview } from "@/components/previews/sheet-drawer-preview"
import { TooltipPopoverPreview } from "@/components/previews/tooltip-popover-preview"

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Step,
    Steps,
    Tab,
    Tabs,
    DocsBaseTabs,
    ComponentDemo,
    ComponentDemoRender,
    ComponentDemoCode,
    DialogDrawerPreview,
    SheetDrawerPreview,
    PopoverDrawerPreview,
    TooltipPopoverPreview,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
