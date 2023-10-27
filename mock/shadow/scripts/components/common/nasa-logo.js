import React from 'react';
import OrigNasaLogo from '$components/common/nasa-logo';

// Replace the Nasa Logo by extending the original component and adding wrapper.

export default function NasaLogo() {
  return (
    <div style={{ background: 'teal' }}>
      <OrigNasaLogo />
    </div>
  );
}
