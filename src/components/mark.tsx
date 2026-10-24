import { cn } from "@/lib/utils"

// A centred dialog that slides down and widens into a bottom drawer with its
// handle, while `drawer` is set or its `group/mark` link is hovered or focused.
export function Mark({
  drawer = false,
  className,
}: {
  drawer?: boolean
  className?: string
}) {
  return (
    <svg
      aria-hidden
      data-drawer={drawer}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className={cn("group/svg shrink-0", className)}
    >
      <path
        d="M7 8h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z"
        className="origin-center transition-[translate,scale,opacity] duration-300 ease-settle transform-fill group-focus-visible/mark:translate-y-[5px] group-focus-visible/mark:scale-x-125 group-focus-visible/mark:opacity-0 group-data-[drawer=true]/svg:translate-y-[5px] group-data-[drawer=true]/svg:scale-x-125 group-data-[drawer=true]/svg:opacity-0 motion-reduce:transition-none can-hover:group-hover/mark:translate-y-[5px] can-hover:group-hover/mark:scale-x-125 can-hover:group-hover/mark:opacity-0"
      />
      <g className="origin-bottom -translate-y-[5px] scale-x-80 opacity-0 transition-[translate,scale,opacity] duration-300 ease-settle transform-fill group-focus-visible/mark:translate-y-0 group-focus-visible/mark:scale-x-100 group-focus-visible/mark:opacity-100 group-data-[drawer=true]/svg:translate-y-0 group-data-[drawer=true]/svg:scale-x-100 group-data-[drawer=true]/svg:opacity-100 motion-reduce:transition-none can-hover:group-hover/mark:translate-y-0 can-hover:group-hover/mark:scale-x-100 can-hover:group-hover/mark:opacity-100">
        <path d="M3 21v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
        <path d="M10.5 17.5h3" />
      </g>
    </svg>
  )
}
