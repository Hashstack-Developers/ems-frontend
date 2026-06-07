'use client';

import type { CSSProperties } from 'react';

const floatingIcons = [
  { icon: '👥', className: 'login-float login-float-1', label: 'Employees' },
  { icon: '💰', className: 'login-float login-float-2', label: 'Payroll' },
  { icon: '📋', className: 'login-float login-float-3', label: 'Taxes' },
  { icon: '🧾', className: 'login-float login-float-4', label: 'Slips' },
  { icon: '🏦', className: 'login-float login-float-5', label: 'GP Fund' },
  { icon: '📊', className: 'login-float login-float-6', label: 'Reports' },
];

export function LoginScene() {
  return (
    <div className="login-scene" aria-hidden>
      <div className="login-scene-gradient" />
      <div className="login-scene-orbs">
        <span className="login-orb login-orb-1" />
        <span className="login-orb login-orb-2" />
        <span className="login-orb login-orb-3" />
      </div>

      <div className="login-scene-perspective">
        <div className="login-scene-grid" />
        <div className="login-scene-ring login-scene-ring-1" />
        <div className="login-scene-ring login-scene-ring-2" />
        <div className="login-scene-orbit">
          {floatingIcons.map((item) => (
            <div key={item.label} className={item.className}>
              <div className="login-cube">
                <div className="login-cube-inner">
                  <span className="login-cube-face login-cube-front">{item.icon}</span>
                  <span className="login-cube-face login-cube-back">{item.icon}</span>
                  <span className="login-cube-face login-cube-right">{item.icon}</span>
                  <span className="login-cube-face login-cube-left">{item.icon}</span>
                  <span className="login-cube-face login-cube-top">{item.icon}</span>
                  <span className="login-cube-face login-cube-bottom">{item.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="login-scene-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="login-particle" style={{ '--i': i } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
