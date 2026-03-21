import React from 'react';

export function useChartEntrance(keys: React.DependencyList) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;
    const startedAt = Date.now();
    setProgress(0);

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const eased = 1 - Math.pow(1 - Math.min(elapsed / 500, 1), 3);
      setProgress(eased);
      if (eased < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, keys);

  return progress;
}
