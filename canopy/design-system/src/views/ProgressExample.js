import React, { useState } from 'react';
import Progress from '../components/progress/Progress';

export default function ProgressWithControl() {
  const [value, setValue] = useState(50);
  return (
    <>
      <Progress value={value} max={100} />
      <br />
      <input
        type="range"
        min="0"
        max="100"
        onChange={e => setValue(parseInt(e.target.value, 10))}
      />
    </>
  );
}
