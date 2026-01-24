import { useRef, useCallback } from "react";

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export const useIconAnimation = <T extends AnimatedIconHandle>() => {
  const ref = useRef<T>(null);

  const onMouseEnter = useCallback(() => {
    ref.current?.startAnimation();
  }, []);

  const onMouseLeave = useCallback(() => {
    ref.current?.stopAnimation();
  }, []);

  return {
    ref,
    events: {
      onMouseEnter,
      onMouseLeave,
    },
  };
};
