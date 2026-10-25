import defaultMdxComponents from "fumadocs-ui/mdx"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import type { MDXComponents } from "mdx/types"
import {
  ComponentDemo,
  ComponentDemoCode,
  ComponentDemoRender,
} from "@/components/component-demo"
import {
  DialogDrawerBodyPaddingExample,
  DialogDrawerSizingExample,
  DialogDrawerSnapPointsExample,
  DialogDrawerSwipeReasonExample,
} from "@/components/previews/dialog-drawer-examples"
import { DialogDrawerPreview } from "@/components/previews/dialog-drawer-preview"
import { OverridePropExample } from "@/components/previews/override-prop-examples"
import {
  PopoverDrawerContentBoxExample,
  PopoverDrawerFooterExample,
  PopoverDrawerHiddenTitleExample,
  PopoverDrawerNonModalExample,
} from "@/components/previews/popover-drawer-examples"
import { PopoverDrawerPreview } from "@/components/previews/popover-drawer-preview"
import {
  SheetDrawerLeftExample,
  SheetDrawerSizingExample,
  SheetDrawerSwipeDownExample,
} from "@/components/previews/sheet-drawer-examples"
import { SheetDrawerPreview } from "@/components/previews/sheet-drawer-preview"
import {
  TooltipPopoverAriaLabelExample,
  TooltipPopoverContentBoxExample,
  TooltipPopoverOverrideExample,
} from "@/components/previews/tooltip-popover-examples"
import { TooltipPopoverPreview } from "@/components/previews/tooltip-popover-preview"

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Step,
    Steps,
    Tab,
    Tabs,
    ComponentDemo,
    ComponentDemoRender,
    ComponentDemoCode,
    DialogDrawerPreview,
    SheetDrawerPreview,
    PopoverDrawerPreview,
    TooltipPopoverPreview,
    OverridePropExample,
    DialogDrawerSnapPointsExample,
    DialogDrawerSizingExample,
    DialogDrawerBodyPaddingExample,
    DialogDrawerSwipeReasonExample,
    SheetDrawerLeftExample,
    SheetDrawerSwipeDownExample,
    SheetDrawerSizingExample,
    PopoverDrawerContentBoxExample,
    PopoverDrawerNonModalExample,
    PopoverDrawerFooterExample,
    PopoverDrawerHiddenTitleExample,
    TooltipPopoverContentBoxExample,
    TooltipPopoverOverrideExample,
    TooltipPopoverAriaLabelExample,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
