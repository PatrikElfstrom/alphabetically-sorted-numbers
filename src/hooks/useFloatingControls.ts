import {
  autoUpdate,
  flip,
  offset,
  size,
  shift,
  useFloating,
} from "@floating-ui/react";
import { useDragControls, useMotionValue } from "motion/react";
import { type PointerEvent, type RefObject, useLayoutEffect, useRef } from "react";

type UseFloatingControlsOptions = {
  controlsMinimized: boolean;
  defaultAnchorRef: RefObject<HTMLElement | null>;
  dragBoundsRef: RefObject<HTMLElement | null>;
  plotSize: number;
};

type PanelAlignment = "left" | "right";

function getViewportPadding(): number {
  return window.innerWidth <= 720 ? 10 : 12;
}

const maxControlsPanelWidth = 750;

function getPanelAlignment(placement: string): PanelAlignment {
  if (placement.startsWith("left")) {
    return "right";
  }

  if (placement.startsWith("right")) {
    return "left";
  }

  return placement.endsWith("end") ? "right" : "left";
}

export function useFloatingControls({
  controlsMinimized,
  defaultAnchorRef,
  dragBoundsRef,
  plotSize,
}: UseFloatingControlsOptions) {
  const dragControls = useDragControls();
  const suppressToggleRef = useRef(false);
  const floatingButtonElementRef = useRef<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const hasUserMovedButtonRef = useRef(false);
  const {
    placement,
    refs: floatingRefs,
    floatingStyles,
    update,
  } = useFloating({
    middleware: [
      offset(10),
      flip({
        crossAxis: true,
        fallbackAxisSideDirection: "end",
        padding: 12,
      }),
      size({
        apply({ availableHeight, availableWidth, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(0, availableHeight)}px`,
            maxWidth: `${Math.max(0, Math.min(availableWidth, maxControlsPanelWidth))}px`,
          });
        },
        padding: 12,
      }),
      shift({
        padding: 12,
      }),
    ],
    open: !controlsMinimized,
    placement: "bottom-end",
    strategy: "fixed",
    whileElementsMounted(reference, floating, updatePosition) {
      return autoUpdate(reference, floating, updatePosition, {
        animationFrame: true,
      });
    },
  });

  const setReference = (node: HTMLButtonElement | null) => {
    floatingButtonElementRef.current = node;
    floatingRefs.setReference(node);
  };

  const setFloating = (node: HTMLElement | null) => {
    floatingRefs.setFloating(node);
  };

  useLayoutEffect(() => {
    if (hasUserMovedButtonRef.current) {
      return;
    }

    const dragBoundsElement = dragBoundsRef.current;
    const defaultAnchorElement = defaultAnchorRef.current;
    const floatingButtonElement = floatingButtonElementRef.current;

    if (!dragBoundsElement || !defaultAnchorElement || !floatingButtonElement) {
      return;
    }

    const dragBoundsRect = dragBoundsElement.getBoundingClientRect();
    const defaultAnchorRect = defaultAnchorElement.getBoundingClientRect();
    const floatingButtonRect = floatingButtonElement.getBoundingClientRect();

    if (
      defaultAnchorRect.width <= 0 ||
      defaultAnchorRect.height <= 0 ||
      dragBoundsRect.width <= 0 ||
      dragBoundsRect.height <= 0 ||
      floatingButtonRect.width <= 0 ||
      floatingButtonRect.height <= 0
    ) {
      return;
    }

    const viewportPadding = getViewportPadding();
    const nextX = Math.max(
      viewportPadding,
      defaultAnchorRect.right -
        dragBoundsRect.left -
        floatingButtonRect.width,
    );
    const nextY = Math.max(
      viewportPadding,
      defaultAnchorRect.top - dragBoundsRect.top,
    );

    x.set(nextX);
    y.set(nextY);
    update();
  }, [defaultAnchorRef, dragBoundsRef, plotSize, update, x, y]);

  return {
    dragControls,
    floatingStyles,
    panelAlignment: getPanelAlignment(placement),
    setFloating,
    setReference,
    shellStyle: {
      left: 0,
      position: "absolute" as const,
      top: 0,
      x,
      y,
    },
    handleButtonPointerDown(event: PointerEvent<HTMLButtonElement>) {
      dragControls.start(event);
    },
    handleDrag() {
      update();
    },
    handleDragStart() {
      hasUserMovedButtonRef.current = true;
      suppressToggleRef.current = true;
    },
    handleDragEnd() {
      window.setTimeout(() => {
        suppressToggleRef.current = false;
      }, 0);
    },
    shouldSuppressToggle() {
      return suppressToggleRef.current;
    },
  };
}
