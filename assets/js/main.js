var html = $('html');
var body = $('body');
var timeout;
var st = 0;
var lastSt = 0;
var titleOffset = 0;
var contentOffset = 0;
var progress = $('.sticky-progress');

$(function () {
  'use strict';
  featured();
  pagination();
  gallery();
  table();
  toc();
  modal();
  search();
  burger();
  gravatar();
  plan();
  theme();
  notification();
});

$(window).on('scroll', function () {
  'use strict';
  if (body.hasClass('post-template')) {
    if (timeout) {
      window.cancelAnimationFrame(timeout);
    }
    timeout = window.requestAnimationFrame(sticky);
  }
});

$(window).on('load', function () {
  'use strict';
  if (body.hasClass('post-template')) {
    titleOffset = $('.single-title').offset().top;

    var content = $('.single-content');
    var contentHeight = content.height();
    contentOffset = content.offset().top + contentHeight - $(window).height() / 2;
  }
});

function sticky() {
  'use strict';
  st = jQuery(window).scrollTop();

  if (titleOffset > 0 && contentOffset > 0) {
    if (st > lastSt) {
      if (st > titleOffset) {
        body.addClass('sticky-visible');
      }
    } else {
      if (st <= titleOffset) {
        body.removeClass('sticky-visible');
      }
    }
  }

  progress.css('transform', 'translateX(' + (-100 + Math.min(st * 100 / contentOffset, 100)) + '%)');

  lastSt = st;
}

function featured() {
  'use strict';
  $('.featured-feed').owlCarousel({
    dots: false,
    margin: 30,
    nav: true,
    navText: ['<svg class="icon"><use xlink:href="#chevron-left"></use></svg>', '<svg class="icon"><use xlink:href="#chevron-right"></use></svg>'],
    responsive: {
      0: {
        items: 1,
      },
      768: {
        items: 2,
      },
      992: {
        items: 3,
      },
    },
  });
}

function pagination() {
  'use strict';
  var wrapper = $('.post-feed');

  if (body.hasClass('paged-next')) {
    wrapper.infiniteScroll({
      append: '.feed',
      button: '.infinite-scroll-button',
      debug: false,
      hideNav: '.pagination',
      path: '.pagination .older-posts',
      scrollThreshold: false,
      status: '.infinite-scroll-status',
    });
  }

  wrapper.on('append.infiniteScroll', function (event, response, path, items) {
    $(items[0]).addClass('feed-paged');
  });
}

function gallery() {
  'use strict';
  var images = document.querySelectorAll('.kg-gallery-image img');
  images.forEach(function (image) {
    var container = image.closest('.kg-gallery-image');
    var width = image.attributes.width.value;
    var height = image.attributes.height.value;
    var ratio = width / height;
    container.style.flex = ratio + ' 1 0%';
  });
}

function table() {
  'use strict';
  if (body.hasClass('post-template') || body.hasClass('page-template')) {
    var tables = $('.single-content').find('.table');
    tables.each(function (_, table) {
      var labels = []

      $(table).find('thead th').each(function (_, label) {
        labels.push($(label).text());
      });
      
      $(table).find('tr').each(function (_, row) {
        $(row).find('td').each(function (index, column) {
          $(column).attr('data-label', labels[index]);
        });
      });
    });
  }
}

function toc() {
  'use strict';
  if (body.hasClass('post-template')) {
    var output = '';

    $('.single-content').find('h2, h3').each(function (index, value) {
      var linkClass = $(this).prop('tagName') == 'H3' ? 'sticky-toc-link sticky-toc-link-indented' : 'sticky-toc-link';
      output += '<a class="' + linkClass + '" href="#' + $(value).attr('id') + '">' + $(value).text() + '</a>';
    });

    $('.sticky-toc').html(output);

    $('.sticky-toc-button').on('click', function () {
      body.toggleClass('toc-opened');
    });

    $('.sticky-toc-link').on('click', function (e) {
      e.preventDefault();
      var link = $(this).attr('href');

      $('html, body').animate({
        scrollTop: $(link).offset().top - 82
      }, 500);
    });
  }
}

function modal() {
  'use strict';
  var modal = $('.modal');
  var modalSearch = $('.modal-search');
  var modalInput = $('.modal-input');

  $('.js-modal').on('click', function (e) {
    e.preventDefault();
    switch ($(this).attr('data-modal')) {
      case 'search':
        modalSearch.show();
        break;
      default:
        break;
    }
    body.addClass('modal-opened');
    modalInput.focus();
  });

  $('.modal-close, .modal-overlay').on('click', function () {
    body.removeClass('modal-opened');
  });

  modal.on('click', function (e) {
    e.stopPropagation();
  });

  $(document).keyup(function (e) {
    if (e.keyCode === 27 && body.hasClass('modal-opened')) {
      body.removeClass('modal-opened');
    }
  });
}

function search() {
  'use strict';
  var searchInput = $('.search-input');
  var searchButton = $('.search-button');
  var searchResult = $('.search-result');
  var popular = $('.popular-wrapper');

  var base = window.location.protocol + "//" + window.location.host + '/' + themeOptions.root_url;
  var url = base + '/ghost/api/v2/content/posts/?key=' + themeOptions.search_key + '&limit=all&fields=id,title,url,updated_at,visibility&order=updated_at%20desc&formats=plaintext';
  var indexDump = JSON.parse(localStorage.getItem('dawn_index'));
  var index;

  function update(data) {
    data.posts.forEach(function (post) {
      index.addDoc(post);
    });

    localStorage.setItem('dawn_index', JSON.stringify(index));
    localStorage.setItem('dawn_last', data.posts[0].updated_at);
  }

  if (!indexDump) {
    $.get(url, function (data) {
      if (data.posts.length > 0) {
        index = elasticlunr(function () {
          this.addField('title');
          this.addField('plaintext');
          this.setRef('id');
        });

        update(data);
      }
    });
  } else {
    index = elasticlunr.Index.load(indexDump);

    $.get(url + '&filter=updated_at:>\'' + localStorage.getItem('dawn_last').replace(/\..*/, '').replace(/T/, ' ') + '\'', function (data) {
      if (data.posts.length > 0) {
        update(data);
      }
    });
  }

  searchInput.on('keyup', function (e) {
    var result = index.search(e.target.value, {});
    var output = '';

    result.forEach(function (post) {
      output += '<div class="search-result-row">' +
        '<a class="search-result-row-link" href="' + post.doc.url + '">' + post.doc.title + '</a>' +
      '</div>';
    });

    searchResult.html(output);

    if (e.target.value.length > 0) {
      searchButton.addClass('search-button-clear');
    } else {
      searchButton.removeClass('search-button-clear');
    }

    if (result.length > 0) {
      popular.hide();
    } else {
      popular.show();
    }
  });

  $('.search-form').on('submit', function (e) {
    e.preventDefault();
  });

  searchButton.on('click', function () {
    if ($(this).hasClass('search-button-clear')) {
      searchInput.val('').focus().keyup();
    }
  });
}

function burger() {
  'use strict';
  $('.burger').on('click', function() {
    body.toggleClass('menu-opened');
  });
}

function gravatar() {
  'use strict';
  var image = $('.account-image');
  if (image.length) {
    image.attr('data-src', 'https://www.gravatar.com/avatar/' + md5(image.attr('data-email')) + '?d=mp&s=160');
    lazySizes.loader.unveil(image[0]);
  }
}

function plan() {
  'use strict';
  var button = $('.plan-selector-button');

  button.on('click', function () {
    button.addClass('button-secondary')
    $(this).removeClass('button-secondary');
    $(this).closest('.plan-selector').attr('class', 'plan-selector plan-selector-' + $(this).attr('data-plan'));
  });
}

function theme() {
  'use strict';
  var toggle = $('.js-theme');

  function light() {
    html.removeClass('theme-dark');
    localStorage.setItem('dawn_theme', 'light');
  }

  function dark() {
    html.addClass('theme-dark');
    localStorage.setItem('dawn_theme', 'dark');
  }

  window.matchMedia('(prefers-color-scheme: light)').addListener(function (e) {
    e.matches && light();
  });
  
  window.matchMedia('(prefers-color-scheme: dark)').addListener(function (e) {
    e.matches && dark();
  });

  toggle.on('click', function () {
    if (html.hasClass('theme-dark')) {
      light();
    } else {
      dark();
    }
  });
}

function notification() {
  'use strict';
  $('.notification-close').on('click', function (e) {
    e.preventDefault();

    body.removeClass('notification-opened');
    var uri = window.location.toString();
    if (uri.indexOf('?') > 0) {
      var clean_uri = uri.substring(0, uri.indexOf('?'));
      window.history.replaceState({}, document.title, clean_uri);
    }

    if ($(this).closest('.auth-form').length) {
      $(this).closest('.auth-form').removeClass('success error');
    }
  });
}

function getParameterByName(name, url) {
  'use strict';
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  var results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}