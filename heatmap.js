/* heatmap.js — GitHub-contribution-style goals calendar.
   Rows = seasons (2004/05 → 2025/26), columns = months Aug → Jul.
   Month-level goal records aren't public, so each row shows that
   season's verified total as a monthly pace (total ÷ 12) — labeled
   as such on the page. No invented dates. */
(function () {
  'use strict';

  /* Mirror of messi-career.json seasonGoals — used when the page's
     inline data isn't available (e.g. script order, file:// quirks). */
  var FALLBACK = [
    { season: '04/05', goals: 1, club: 'Barcelona' },
    { season: '05/06', goals: 8, club: 'Barcelona' },
    { season: '06/07', goals: 17, club: 'Barcelona' },
    { season: '07/08', goals: 16, club: 'Barcelona' },
    { season: '08/09', goals: 38, club: 'Barcelona' },
    { season: '09/10', goals: 47, club: 'Barcelona' },
    { season: '10/11', goals: 53, club: 'Barcelona' },
    { season: '11/12', goals: 73, club: 'Barcelona' },
    { season: '12/13', goals: 60, club: 'Barcelona' },
    { season: '13/14', goals: 41, club: 'Barcelona' },
    { season: '14/15', goals: 58, club: 'Barcelona' },
    { season: '15/16', goals: 41, club: 'Barcelona' },
    { season: '16/17', goals: 54, club: 'Barcelona' },
    { season: '17/18', goals: 45, club: 'Barcelona' },
    { season: '18/19', goals: 51, club: 'Barcelona' },
    { season: '19/20', goals: 31, club: 'Barcelona' },
    { season: '20/21', goals: 38, club: 'Barcelona' },
    { season: '21/22', goals: 11, club: 'PSG' },
    { season: '22/23', goals: 21, club: 'PSG / Inter Miami' },
    { season: '23/24', goals: 19, club: 'Inter Miami' },
    { season: '24/25', goals: 18, club: 'Inter Miami' },
    { season: '25/26', goals: 12, club: 'Inter Miami' }
  ];

  var MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  /* notebook palette: paper → sky blue → ink navy, gold for 50+ peaks */
  var LEVELS = ['rgba(26,39,68,0.055)', 'rgba(117,170,219,0.38)', 'rgba(117,170,219,0.68)', 'rgba(61,122,181,0.95)', '#C5A55A'];

  function level(goals) {
    if (goals < 15) return 1;
    if (goals < 30) return 2;
    if (goals < 50) return 3;
    return 4;
  }

  function getSeasons() {
    return (window.__GM_SEASONS && window.__GM_SEASONS.length === 22)
      ? window.__GM_SEASONS
      : FALLBACK;
  }

  function build(el) {
    var seasons = getSeasons();
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var tip = document.createElement('div');
    tip.className = 'heat-tip';
    el.appendChild(tip);

    var grid = document.createElement('div');
    grid.className = 'heat-grid';
    el.appendChild(grid);

    // month header
    var corner = document.createElement('div');
    corner.className = 'heat-cell heat-corner';
    grid.appendChild(corner);
    MONTHS.forEach(function (m) {
      var d = document.createElement('div');
      d.className = 'heat-cell heat-month';
      d.textContent = m;
      grid.appendChild(d);
    });

    seasons.forEach(function (s, row) {
      var lab = document.createElement('div');
      lab.className = 'heat-cell heat-rowlab';
      lab.textContent = s.season;
      grid.appendChild(lab);
      var lv = level(s.goals);
      for (var m = 0; m < 12; m++) {
        var cell = document.createElement('div');
        cell.className = 'heat-cell';
        cell.style.background = LEVELS[lv];
        cell.setAttribute('data-season', s.season);
        cell.setAttribute('data-goals', s.goals);
        cell.setAttribute('data-club', s.club);
        if (!reduced) {
          cell.style.opacity = 0;
          cell.style.transition = 'opacity .4s';
          cell.style.transitionDelay = (row * 28) + 'ms';
        }
        grid.appendChild(cell);
      }
    });

    // reveal
    function reveal() {
      if (reduced) return;
      Array.prototype.forEach.call(grid.querySelectorAll('.heat-cell[data-goals]'), function (c) {
        c.style.opacity = 1;
      });
    }
    if ('IntersectionObserver' in window && !reduced) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { reveal(); io.disconnect(); }
        });
      }, { threshold: 0.25 });
      io.observe(el);
    } else {
      reveal();
    }

    // tooltip
    el.addEventListener('mousemove', function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains('heat-cell') || !t.dataset.goals) {
        tip.classList.remove('on');
        return;
      }
      var pace = (parseInt(t.dataset.goals, 10) / 12).toFixed(1);
      tip.innerHTML = '<strong>' + t.dataset.season + '</strong> · ' + t.dataset.club +
        '<br>' + t.dataset.goals + ' goals · ≈ ' + pace + ' per month';
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var flip = x > r.width - 190;
      tip.style.left = (flip ? x - 185 : x + 14) + 'px';
      tip.style.top = (y - 52) + 'px';
      tip.classList.add('on');
    });
    el.addEventListener('mouseleave', function () { tip.classList.remove('on'); });

    // legend
    var legend = document.createElement('div');
    legend.className = 'heat-legend';
    legend.innerHTML = '<span>less</span>' + LEVELS.map(function (c) {
      return '<i style="background:' + c + '"></i>';
    }).join('') + '<span>more</span>';
    el.appendChild(legend);
  }

  function init() {
    var el = document.getElementById('goalsHeatmap');
    if (el) build(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
