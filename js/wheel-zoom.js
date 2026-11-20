export function wheelZoom(event, scale) {
  const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 240 : 1;
  return Math.max(1, Math.min(4, scale * Math.exp(-event.deltaY * unit * .002)));
}
