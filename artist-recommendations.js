var LastFmNode = require('lastfm').LastFmNode,
    _ = require('underscore'),
    config = require('./config'),
    lastfm = new LastFmNode({
        api_key: config.api_key,
        secret: config.secret
    });

var user = process.argv[2];
if (!user) {
    console.log('Usage: node artist-recommendations.js [name]');
    process.exit(1);
}

generateRecommendationsFor(user, function(recommendations) {
    console.log(recommendations);
});

function generateRecommendationsFor(user, callback) {
    getFriendsUserNames(user, function(error, names) {
        getAllFriendsTopArtists(names, function(topArtists) {
            removeKnownArtists(user, topArtists, callback);
        });
    });
}

function getFriendsUserNames(user, callback) {
    lastfm.request('user.getfriends', {
        user: user,
        handlers: {
            success: function(data) {
                if (typeof data !== 'object') {
                    data = JSON.parse(data);
                }
                var names = _(data.friends.user).map(function(user) {
                    return user.name;
                });
                callback(null, names);
            },
            error: function(error) {
                console.log(error);
            }
        }
    });
}

function getAllFriendsTopArtists(names, callback) {
    var index = 0,
        topArtists = [];

    getNextFriendsTopArtists(callback);

    function getNextFriendsTopArtists(callback) {
        getFriendsTopArtists(names[index], processTopArtists);
    }

    function processTopArtists(error, artists) {
        addTopArtists(artists);
        nextFriendOrFinish(callback);
    }

    function addTopArtists(plays) {
        topArtists = topArtists.concat(plays);
    }

    function nextFriendOrFinish(callback) {
        index++;
        if (index < names.length) {
            getNextFriendsTopArtists(callback);
        }
        else {
            callback(aggregateTotalPlays(topArtists));
        }
    }
}

function aggregateTotalPlays(topArtists) {
    var total = _(topArtists).reduce(function(memo, plays) {
        memo[plays.name] = memo[plays.name] || 0;
        memo[plays.name] += plays.playcount;
        return memo;
    }, { });
    var list = _(total).map(function(value, key, list) {
        return {
            name: key,
            count: value
        };
    });
    var sortedList = _(list).sortBy(function(item) {
        return -item.count;
    });
    return sortedList
}

function getFriendsTopArtists(user, callback) {
    lastfm.request('user.gettopartists', {
        user: user,
        period: '3month',
        handlers: {
            success: function(data) {
                if (typeof data !== 'object') {
                    data = JSON.parse(data);
                }
                var artists = _(data.topartists.artist).map(function(artist) {
                    return {
                        name: artist.name,
                        playcount: parseInt(artist.playcount)
                    };
                });
                callback(null, artists);
            },
            error: callback
        }
    });
}

function removeKnownArtists(user, artists, callback) {
    var index = 0,
        recommendations = [];

    checkLibraryForNextArtist();

    function checkLibraryForNextArtist() {
        var artist = artists[index].name;
        getArtistListensFor(user, artist, function(count) {
            if (count == 0) {
                addRecommendation(artist);
            }
            nextArtistOrFinish();
        });
    }

    function nextArtistOrFinish() {
        index++;
        if (index < artists.length && recommendations.length < 10) {
            checkLibraryForNextArtist();
        }
        else {
            callback(recommendations);
        }
    }

    function addRecommendation(artist) {
        recommendations.push(artist);
    }
}

function getArtistListensFor(user, artist, callback) {
    lastfm.request('user.getartisttracks', {
        user: user,
        artist: artist,
        handlers: {
            success: function(data) {
                if (typeof data !== 'object') {
                    data = JSON.parse(data);
                }
                if (data.artisttracks.track) {
                    callback(data.artisttracks['@attr'].total);
                }
                else {
                    callback(0);
                }
            },
            error: function(error) {
                callback(0);
            }
        }
    });
}
