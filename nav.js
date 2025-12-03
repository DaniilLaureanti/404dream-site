// Navigation scroll helper
// This script enhances the horizontal navigation bar by automatically scrolling
// the clicked or current menu item into view and applying an active
// indicator.  It runs on page load and attaches click handlers to each
// nav link so that when a user taps an item the horizontal scroll
// positions the item into view.

document.addEventListener('DOMContentLoaded', function() {
  var navScroll = document.querySelector('.nav-scroll');
  if (!navScroll) return;

  // Helper to scroll a target element into horizontal view
  function scrollToItem(el) {
    if (!el) return;
    // Use block: 'nearest' to avoid vertical jumps, and inline: 'center'
    // to centre the clicked item within the scroll container if possible.
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // Mark the current page link and scroll to it
  var currentLink = navScroll.querySelector('a[aria-current="page"]');
  if (currentLink) {
    currentLink.classList.add('active-nav');
    // Scroll current link into view after DOM ready
    scrollToItem(currentLink);
  }

  // Attach click handler to each nav link to scroll into view on click
  navScroll.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      // Remove previously applied active class
      navScroll.querySelectorAll('a').forEach(function(other) {
        other.classList.remove('active-nav');
      });
      // Apply active class to the clicked link
      link.classList.add('active-nav');
      // Scroll the clicked item into view
      scrollToItem(link);
    });
  });
});