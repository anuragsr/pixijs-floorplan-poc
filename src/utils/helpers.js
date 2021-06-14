const wc = window.console
module.exports = {
  cl : console.clear.bind(wc),
  l : console.log.bind(wc),
  isMobile : () => window.innerWidth <= 768
}
