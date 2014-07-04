jQuery.ajaxSettings.traditional = true; 
var api_key = '1SZKGEEHOWNRCJ8SJ';

var standardBuckets = [ 'biographies', 'hotttnesss', 'familiarity', 'images', 'artist_location', 'reviews', 'terms', 'urls', 'video',
'years_active', 'doc_counts', 'songs', 'id:facebook', 'id:twitter', 'genre']; 

var allImages = null;
var curImage = 0;

var allVideos = null;
var curVideo = 0;
var deferredSong = null;

function info(s) {
    $("#info").removeClass();
    if (s.length > 0) {
        $("#info").addClass("alert alert-info");
    }
    $("#info").text(s);
}

function tinfo(s) {
    info(s);
    setTimeout( function() { info(""); }, 5000);
}

function error(s) {
    $("#info").removeClass();
    if (s.length > 0) {
        $("#info").addClass("alert alert-error");
    }
    $("#info").text(s);
}

function terror(s) {
    error(s);
    setTimeout( function() { error(""); }, 5000);
}

function getRdioID(song) {
    var id = song.tracks[0].foreign_id;
    var rawID = id.split(':')[2]
    return rawID;
}

function hasTrack(song) {
    return 'tracks' in song && song.tracks.length > 0;
}

function playSong(song) {
    if (hasTrack(song)) {
        var rdioID = getRdioID(song);
        if (R.player) {
            R.player.play({
                source: rdioID
            });
        } else {
            deferredSong = song;
        }
    }
    $("#rp-song-title").text(song.title);
    $("#rp-artist-name").text(song.artist_name);
    document.title = song.artist_name;
}

function playNextSong() {
    fetchNextTrack();
}


function fetchNextTrack() {
    var url = 'http://developer.echonest.com/api/v4/playlist/dynamic/next';

    var args = { 
        api_key : api_key,
        session_id : session_id,
        results: 1,
        lookahead: 5,
    };

    $.getJSON(url, args,
        function(data) {
            if (data.response.songs.length > 0) {
                playSong(data.response.songs[0]);
            }
        },
        function() {
            terror("Trouble creating playlist session for " + artist);
        }
    );
}

function createDynamicPlaylist(artist) {
    var url = 'http://developer.echonest.com/api/v4/playlist/dynamic/create';

    var args = {
        'artist': artist, 
        'api_key' : api_key,
        'bucket': [ 'id:rdio-US', 'tracks'], 'limit' : true,
        'type':'artist',
        'sort' :'song_hotttnesss-desc',
        'dmca': false
    };

    $.getJSON(url, args,
        function(data) {
            if (data.response.status.code == 0) {
                session_id = data.response.session_id;
                autoStop = true; // new artist, queue up but don't play
                fetchNextTrack();
            } else {
                terror("Trouble creating playlist for artist " + artist);
            }
        },
        function() {
            terror("Trouble creating playlist session for " + artist);
        }
    );
}

function now() {
    return new Date().getTime();
}


function showBio(artist) {
    var elem = getBio(artist);
    $("#bio").empty();
    $("#bio").append(elem);
}


function showInfo(artist) {
    $("#artist-name").text(artist.name);
    $("#artist-years-active").text(fmtYearsActive(artist.years_active));
    $("#artist-hotttnesss").text(artist.hotttnesss);
    $("#artist-familiarity").text(artist.familiarity);
    $("#artist-id").text(artist.id);

    if ('artist_location' in artist) {
        $("#artist-location").text(artist.artist_location.location);
    }
}

function fmtYearsActive(yearsActive) {
    var out = "";

    $.each(yearsActive, function(i, ya) {
        if ('start' in ya) {
            out += ya.start;
        }
        out += '-';
        if ('end' in ya) {
            out += ya.end;
        }
        if (i < yearsActive.length -1) {
            out += ", ";
        }
    });
    return out;
}

function getBestBio(bios) {
    var best = null;
    if (bios.length > 0) {
        best = bios[0];

        for (var i = 0; i < bios.length; i++) {
            //if (bios[i].site == 'last.fm') {
            if (bios[i].site == 'wikipedia') {
                best = bios[i];
            }
        }
    }
    return best;
}

function formatBioText(bio) {
    var text = bio.text;
    text = text.replace('\r', '<br>');
    text = text.replace('\n', '<br>');
    dot = text.indexOf(".", 1400);
    if (dot == -1) {
        dot = 1000;
    }
    text = text.substring(0, dot + 1);
    return text + "  ";
}

function getBioImage(images) {
    if (images.length > 0) {
        var image = images[0];
        var img = $("<img>");
        img.error(function() { $(this).hide(); });
        img.attr('src', image.url);
        img.addClass('bio-image');
        return img;
    } else {
        return null;
    }
}

function getBio(item) {
    var elem = $("<span>");
    var bio = getBestBio(item.biographies);
    if (bio) {
        var imgElem = getBioImage(item.images);
        var bioElem = $("<span>").html(formatBioText(bio));
        var linkElem = $("<a>").attr('href', bio.url).text(" via " + bio.site);

        if (imgElem) {
            elem.append(imgElem);
        }
        elem.append(bioElem);
        elem.append(linkElem);
    } else {
        elem.text("(none)");
    }
    return elem;
}


function makeArtistLink(artist) {
    var link = $("<a>")
        .text(artist.name)
        .attr('href', "?id=" + artist.id);
    return link;
}

function showSimilarArtists(sims) {
    var div = $("#similar-artists");
    div.empty();

    $.each(sims, function(index, sim) {
        div.append(makeArtistLink(sim));
        if (index < sims.length -1) {
            div.append($("<span>").text(", "));
        }
    });
}


function showTopTerms(artist) {
    var maxTerms = 32;
    $("#top-genre-header").text("Top Terms");
    var div = $("#top-genres");
    div.empty();
    $.each(artist.terms, function(i, term) {
        if (i < maxTerms) {
            var tspan = $("<span>").text(term.name);
            div.append(tspan);
            if (i < maxTerms - 1) {
                div.append($("<span>").text(", "));
            }
        }
    });
}

function showTopGenres(artist) {
    $("#top-genre-header").text("Top Genres");
    var div = $("#top-genres");
    div.empty();
    $.each(artist.genres, function(i, genre ) {
        var tspan = $("<span>").text(genre.name);
        div.append(tspan);
        if (i < artist.genres.length - 1) {
            div.append($("<span>").text(", "));
        }
    });
    return artist.genres.length;
}

function showURLs(artist) {
    function makeName(key) {
        return key.replace('_url', '');
    }

    var div = $("#artist-urls");
    div.empty();
    $.each(artist.urls, function(key, url) {
        var link = $("<a>")
            .text(makeName(key))
            .attr('href', url);
        div.append(link);
        div.append($("<span>").text(' '));
    });
}



function getSource(url) {
    var path = url.split('/');
    return path[2]  ;
}


function formatNews(news) {
    var div = $("<div class='news well'>");
    div.append($("<h4>").html(news.name));

    var date = "";
    if ('date_posted' in news) {
        date = "<i>" + news.date_posted.substring(0,10) + '</i> ';
    }

    div.append($("<p>").html(date + news.summary + " ..." ));
    var link = $("<a>");
    link.attr('href', news.url);
    link.text("full story on " + getSource(news.url));
    div.append(link);
    return div;
}

var blackList = ['www.crawdaddy.com'];

function formatReview(item) {
    var div = $("<div class='well clearfix'>");
    var source = getSource(item.url);

    if (blackList.indexOf(source) != -1) {
        return null;
    }

    div.append($("<h4>").html(item.name));

    if (item.image_url) {
        div.append($("<img style='float:left;margin-right:10px;max-width:50px'>")
            .attr('src', item.image_url)
            .error(function() { $(this).hide();}));
    }

    var date = null;
    if ('date_posted' in item) {
        date = item.date_posted;
    } else if ('date_found' in item) {
        date = item.date_found;
    }
    if (date) {
        date = "<i>" + date.substring(0,10) + '</i> ';
    }

    div.append($("<p>").html(date + item.summary + " ..." ));
    var link = $("<a>");
    link.attr('href', item.url);
    link.text("full review on " + source);
    div.append(link);
    return div;
}

function formatBlog(item) {
    var div = $("<div class='article well'>");
    div.append($("<h4>").html(item.name));

    var date = "";
    if ('date_posted' in item) {
        date = "<i>" + item.date_posted.substring(0,10) + '</i> ';
    }

    div.append($("<p>").html(date + item.summary + " ..." ));
    var link = $("<a>");
    link.attr('href', item.url);
    link.text("full post on " + getSource(item.url));
    div.append(link);
    return div;
}





function showNews(news) {
    $("#news-div").show();
    var div = $("#news");
    div.empty();
    if (news && news.length > 0) {
        $.each(news, function(index, article) {
            var ndiv = formatNews(article);
            div.append(ndiv);
        });
    } else {
        div.html("No news");
    }
}

function showReviews(reviews) {
    var div = $("#reviews");
    $("#news-div").show();
    div.empty();
    if (reviews && reviews.length > 0) {
        $.each(reviews, function(index, article) {
            var ndiv = formatReview(article);
            div.append(ndiv);
        });
    } else {
        div.html("No reviews");
    }
}

function showBlogs(blogs) {
    var div = $("#blogs");
    $("#news-div").show();
    div.empty();
    if (blogs && blogs.length > 0) {
        $.each(blogs, function(index, article) {
            var ndiv = formatBlog(article);
            div.append(ndiv);
        });
    } else {
        div.html("No blogs");
    }
}



function showImage(image) {
    var img = $("#aimages");
    if (image) {
        img.css("background-image", "url(" + image.url + ")");
        if (image.license.attribution) {
            $("#image-attribution").text(image.license.attribution);
        } else {
            $("#image-attribution").text("");
        }
        img.show();
    } else {
        img.hide();
    }
}

function showVideo(video) {
    var img = $("#avideo");
    if (video) {
        img.css("background-image", "url(" + video.image_url + ")");
        $("#video-title").text(video.title);
        $("#video-site").text(video.site);
        $("#vid-play").attr('href', video.url);
        img.show();
    } else {
        img.hide();
    }
}


function showImages(images) {
    allImages = images;
    curImage = 0;
    showImage(allImages[0]);
}

function showVideos(videos) {
    allVideos = videos;
    curVideo = 0;
    if (allVideos.length > 0) {
        showVideo(allVideos[0]);
    }
}

function showDocCounts(doc_counts) {
    var div = $("#artist-doc-counts");
    var cols = 2;
    div.empty();
    var tr;
    
    var col  = 0;

    $.each(doc_counts, function(key, count) {
        if (col %2 == 0) {
            tr = $("<tr>");
        }
        tr.append( $("<th>").text(key) );
        tr.append( $("<td>").text(count) );

        if (col % 2 == 1) {
            div.append(tr);
        }
        col++;
    });
    if (col % 2 == 1) {
        div.append(tr);
    }
}

function showArtist(artist) {
    $("#yes-artist").show();
    $("#no-artist").hide();
    showInfo(artist);
    showBio(artist);

    if (showTopGenres(artist) == 0) {
        showTopTerms(artist);
    }
    showURLs(artist);
    showVideos(artist.video);
    showReviews(artist.reviews);
    showImages(artist.images);
    showDocCounts(artist.doc_counts);
    stuffArtistInURL(artist);
}

function stuffArtistInURL(artist) {
    history.replaceState({}, document.title, '?id=' + artist.id);
}

function foundArtist(artist) {
    info("");
    showArtist(artist); 
    nothingPlaying();
    createDynamicPlaylist(artist.id);
    fetchSimilars(artist.id);
    fetchNews(artist.id, true);
    fetchBlogs(artist.id, true);
}


function fetchArtistInfoByName(name) {
    var url = 'http://developer.echonest.com/api/v4/artist/search';

    var args = {
        'api_key' : api_key,
        'name' : name,
        'bucket': standardBuckets,
        'results' : 1,
    };

    info("Going Backstage to look for " + name);
    $.getJSON(url, args,
        function(data) {
            if (data.response.status.code == 0) {
                if (data.response.artists.length > 0) {
                    var artist = data.response.artists[0];
                    foundArtist(artist);
                } else {
                    terror("Can't find " + name);
                }
            } else {
                terror("Trouble getting the artist info");
            }
        },
        function() {
            terror("Trouble getting the artist info for " + artist);
        }
    );
}

function fetchArtistInfoByID(id) {
    var url = 'http://developer.echonest.com/api/v4/artist/profile';

    var args = {
        'api_key' : api_key,
        'id' : id,
        'bucket': standardBuckets,
    };

    $.getJSON(url, args,
        function(data) {
            if (data.response.status.code == 0) {
                var artist = data.response.artist;
                foundArtist(artist);
            } else {
                terror("Trouble getting the artist info for id " + id);
            }
        },
        function() {
            terror("Trouble getting the artist info for " + id);
        }
    );
}

function fetchSimilars(id) {
    var url = 'http://developer.echonest.com/api/v4/artist/similar';

    var args = {
        'id': id, 
        'api_key' : api_key,
        'results' : 30,
    };

    $.getJSON(url, args,
        function(data) {
            if (data.response.status.code == 0) {
                showSimilarArtists(data.response.artists); 
            } else {
                terror("Trouble getting the artist similars");
            }
        },
        function() {
            terror("Trouble getting the artist info for " + artist);
        }
    );
}

function fetchNews(id, relevant) {
    var url = 'http://developer.echonest.com/api/v4/artist/news';

    var args = {
        'id': id, 
        'api_key' : api_key,
        'high_relevance' : relevant
    };

    $.getJSON(url, args,
        function(data) {
            if (data.response.status.code == 0) {
                if (data.response.news.length > 0) {
                    showNews(data.response.news);
                } else if (relevant) {
                    fetchNews(id, false);
                } else {
                    showNews(null);
                }
            } else {
                terror("Trouble getting the artist news");
            }
        },
        function() {
            terror("Trouble getting the artist info for " + artist);
        }
    );
}

function fetchBlogs(id, relevant) {
    var url = 'http://developer.echonest.com/api/v4/artist/blogs';

    var args = {
        'id': id, 
        'api_key' : api_key,
        'high_relevance' : relevant
    };

    $.getJSON(url, args,
        function(data) {
            if (data.response.status.code == 0) {
                if (data.response.blogs.length > 0) {
                    showBlogs(data.response.blogs);
                } else if (relevant) {
                    fetchBlogs(id, false);
                } else {
                    showBlogs(null);
                }
            } else {
                terror("Trouble getting the artist news");
            }
        },
        function() {
            terror("Trouble getting the artist info for " + artist);
        }
    );
}



function go() {
    var artist = $("#artist").val();
    if (artist.length > 0) {
        fetchArtistInfoByName(artist);
    } else {
        terror("Type an artist first");
    }
}

function go2() {
    var artist = $("#artist2").val();
    if (artist.length > 0) {
        fetchArtistInfoByName(artist);
    } else {
        terror("Type an artist first");
    }
}

function processParams() {
    function urldecode(str) {
       return decodeURIComponent((str+'').replace(/\+/g, '%20'));
    }

    var params = {};
    var q = document.URL.split('?')[1];
    if(q != undefined){
        q = q.split('&');
        for(var i = 0; i < q.length; i++){
            var pv = q[i].split('=');
            var p = pv[0];
            var v = pv[1];
            params[p] = urldecode(v);
        }
    }

    if ('id' in params) {
        var id = params['id'];
        fetchArtistInfoByID(id);
    } else if ('name' in params) {
        var name = params['name'];
        fetchArtistInfoByName(name);
    }
}

function initUI() {
    $("#the-player").hide();
    $("#artist").keydown(
        function(){
            if (event.keyCode == 13) {
                go();
            }
        });

    $("#artist2").keydown(
        function(){
            if (event.keyCode == 13) {
                go2();
            }
        });
    $("#go").click(go2);

    $("#img-next").click(function(){

        if (++curImage >= allImages.length) {
            curImage = 0;
        }
        if (curImage < allImages.length) {
            showImage(allImages[curImage]);
        }
    });
    $("#img-prev").click(function(){

        if (--curImage < 0)  {
            curImage = allImages.length - 1;
        }
        if (curImage >= 0) {
            showImage(allImages[curImage]);
        }
    });

    $("#aimages").hover( 
        function(evt) {
            $('.image-annotations').show();
        },
        function(evt) {
            $('.image-annotations').hide();
        }
    );

    $("#vid-next").click(function(){

        if (++curVideo >= allVideos.length) {
            curVideo = 0;
        }
        if (curVideo < allVideos.length) {
            showVideo(allVideos[curVideo]);
        }
    });

    $("#vid-prev").click(function(){

        if (--curVideo < 0)  {
            curVideo = allVideos.length - 1;
        }
        if (curVideo >= 0) {
            showVideo(allVideos[curVideo]);
        }
    });

    $("#avideo").hover( 
        function(evt) {
            $('.video-annotations').show();
        },
        function(evt) {
            $('.video-annotations').hide();
        }
    );
}

function nothingPlaying() {
    $("#the-player").hide();
}

$(document).ready(function() {

    var trackStartTime = now();

    $.ajaxSetup( {cache: false});

    fetchApiKey( function(apiKey, isLoggedIn) {
        api_key = apiKey;
    });

    initUI();
    R.ready(function() {
        R.player.on("change:playingTrack", function(track) {
            if (track) {
                $("#the-player").show();

                var image = track.attributes.icon;
                $("#rp-album-art").attr('src', image);
                trackStartTime = now();
            } else {
                playNextSong();
            }
        });

        R.player.on("change:playState", function(state) {
            if (state == R.player.PLAYSTATE_PAUSED) {
                $("#rp-pause-play i").removeClass("icon-pause");
                $("#rp-pause-play i").addClass("icon-play");
            }
            if (state == R.player.PLAYSTATE_PLAYING) {
                if (autoStop) {
                    autoStop = false;
                    R.player.pause();
                }
                $("#rp-pause-play i").removeClass("icon-play");
                $("#rp-pause-play i").addClass("icon-pause");
            }
        });

        R.player.on("change:playingSource", function(track) {});

        $("#rp-pause-play").click(function() {
            R.player.togglePause();
        });

        $("#rp-next").click(function() {
            playNextSong();
        });

        console.log('rdio ready');
        if (deferredSong) {
            playSong(deferredSong);
            deferredSong = null;
        }
    });
    processParams();
});