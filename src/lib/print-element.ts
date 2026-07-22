/**
 * Print a DOM node by cloning it onto document.body so modal/layout
 * overflow clipping cannot hide content in the browser print preview.
 */
export function printElementById(elementId: string): void {
  const source = document.getElementById(elementId);
  if (!source) {
    window.print();
    return;
  }

  const existing = document.getElementById('ems-print-root');
  existing?.remove();

  const root = document.createElement('div');
  root.id = 'ems-print-root';
  root.setAttribute('data-print-root', 'true');

  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.classList.add('ems-print-document');
  root.appendChild(clone);
  document.body.appendChild(root);
  document.body.classList.add('ems-printing');

  const cleanup = () => {
    document.body.classList.remove('ems-printing');
    root.remove();
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  // Allow the clone to paint before opening the print dialog.
  window.setTimeout(() => {
    window.print();
    // Fallback cleanup for browsers that skip afterprint.
    window.setTimeout(cleanup, 1000);
  }, 50);
}
