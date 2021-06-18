const wc = window.console
module.exports = {
  cl : console.clear.bind(wc),
  // l : console.log.bind(wc),
  l: () => {}, // no-op
  isMobile : () => window.innerWidth <= 768,
  getDistance: (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
  getMaxRadius : (x, y, points) => {
    let max = 0
    points.forEach(point => max = Math.max(max, module.exports.getDistance(x, y, point.x, point.y)))
    return max
  }
}
