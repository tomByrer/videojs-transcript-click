/*global window, videojs, Html, ScrollHelper, Utils*/
var Plugin = (function (window, videojs) {
  var defaults = {
    autoscroll: true
  },
    transcript;
  /**
   * Initialize the plugin.
   * @param options (optional) {object} configuration for the plugin
   */
  transcript = function (options) {
    var settings = videojs.util.mergeOptions(defaults, options);
    var player = this;
    var htmlPrefix = 'transcript';
    var htmlContainer = document.createElement('div');
    var tracks;
    var currentTrack;
    var getAllTracks = function () {
      var i, kind;
      var validTracks = [];
      tracks = player.textTracks();
      for (i = 0; i < tracks.length; i++) {
        kind = tracks[i].kind();
        if (kind === 'captions' || kind === 'subtitles') {
          validTracks.push(tracks[i]);
        }
      }
      return validTracks;
    };
    var getActiveTrack = function (tracks) {
      var i;
      for (i = 0; i < tracks.length; i++) {
        if (tracks[i].mode() === 2 && tracks[i].cues().length > 0) {
          return tracks[i];
        }
      }
      return currentTrack || tracks[0];
    };
    var getCaptionNodes = function () {
      var i, node, caption;
      var nodes = document.querySelectorAll('#' + htmlContainer.id + ' > .' + htmlPrefix + '-line');
      var captions = [];
      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        caption = {
          'element': node,
          'begin': node.getAttribute('data-begin'),
        };
        captions.push(caption);
      }
      return captions;
    };
    var timeUpdate = function () {
      var caption, end, i;
      var time = player.currentTime();
      var captions = getCaptionNodes();
      for (i = 0; i < captions.length; i++) {
        caption = captions[i];
        // Remain active until next caption.
        // On final caption, remain active until video duration if known, or forever;
        if (i < captions.length - 1) {
          end = captions[i + 1].begin;
        } else {
          end = player.duration() || Infinity;
        }
        if (time > caption.begin && time < end) {
          if (!caption.element.classList.contains('is-active')) { // don't update if it hasn't changed
            caption.element.classList.add('is-active');
            if (settings.autoscroll && ScrollHelper.isScrollable(htmlContainer)) {
              ScrollHelper.scrollUpIntoView(caption.element);
            }
          }
        } else {
          caption.element.classList.remove('is-active');
        }
      }
    };
    var trackChange = function () {
      currentTrack = getActiveTrack(tracks);
      Html.setTrack(currentTrack);
    };
    tracks = getAllTracks();
    if (tracks.length > 0) {
      Html.init(htmlContainer, player, htmlPrefix);
      trackChange();
      player.on('timeupdate', timeUpdate);
      player.on('captionstrackchange', trackChange);
      player.on('subtitlestrackchange', trackChange);
    } else {
      throw new Error('videojs-transcript: No tracks found!');
    }
    var getContainer = function () {
      return htmlContainer;
    };
    return {
      getContainer: getContainer,
    };
  };
  return {transcript: transcript};
}(window, videojs));