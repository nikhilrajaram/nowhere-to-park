export function useIsEmbed() {
  return new URLSearchParams(window.location.search).get('embed') === 'true';
}
