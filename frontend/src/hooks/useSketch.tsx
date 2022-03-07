import React from 'react';
import P5 from 'p5';

type P5UpdateWithPropsFunc = (props: any) => void;

export type P5WithProps = P5 & {
  updateWithProps: P5UpdateWithPropsFunc;
};

export type SketchFunc = (p5: P5WithProps) => void;

// function that takes a sketch func, renders it and returns a function to update it
export default function useSketch(
  sketchFunc: SketchFunc,
  parentDiv: React.MutableRefObject<HTMLElement | null>,
): P5UpdateWithPropsFunc | null {
  const [updateFunc, setUpdateFunc] =
    React.useState<P5UpdateWithPropsFunc | null>(null);

  React.useLayoutEffect(() => {
    if (!parentDiv.current) {
      return () => {
        console.warn('unmounting empty sketch');
      };
    }
    const sketch = new P5(sketchFunc, parentDiv.current) as P5WithProps;
    setUpdateFunc(() => sketch.updateWithProps);

    return () => {
      // clean up sketch by removing all canvas elems under div
      sketch.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentDiv.current, sketchFunc]);

  return updateFunc;
}
