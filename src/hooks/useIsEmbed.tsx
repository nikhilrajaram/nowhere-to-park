/**
 * Indicates whether or not the website should render as if embedded in another
 */
export function useIsEmbed() {
  return new URLSearchParams(window.location.search).get('embed') === 'true';
}
