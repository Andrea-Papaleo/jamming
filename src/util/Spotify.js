import { spotifyAPIClientId } from "./tokens";
var accessToken;
console.log("file_loaded");
const clientID = spotifyAPIClientId;
const redirectURI = "http://localhost:3000";
export const Spotify = {
  getAccesToken() {
    if (accessToken) {
      return accessToken;
    }
    const url = window.location.href;
    const accessTokenMatch = url.match(/access_token=([^&]*)/);
    const expiresInMatch = url.match(/expires_in=([^&]*)/);

    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      window.setTimeout(() => (accessToken = ""), expiresIn * 1000);
      window.history.pushState("Access Token", null, "/");
      return accessToken;
    } else {
      const accessURL = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
      return (window.location = accessURL);
    }
  },
  async search(term) {
    const access_token = Spotify.getAccesToken();
    const url = `https://api.spotify.com/v1/search?type=track&q=${term}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        if (!jsonResponse.tracks) {
          return [];
        }
        //console.log(jsonResponse.tracks.items);
        return jsonResponse.tracks.items.map((track) => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri,
        }));
      }
    } catch (error) {
      console.log(error);
    }
  },
  async savePlaylist(playlistName, trackURIs) {
    if (!playlistName || !trackURIs.length) {
      return;
    }
    const access_token = Spotify.getAccesToken();
    const userIdURL = "https://api.spotify.com/v1/me";
    const headers = { Authorization: `Bearer ${access_token}` };
    let userID;

    try {
      const response = await fetch(userIdURL, {
        headers: headers,
      });
      if (response.ok) {
        const jsonResponse = await response.json();
        userID = jsonResponse.id;
      }
    } catch (error) {
      console.log(error);
    }

    const createPlaylistURL = `https://api.spotify.com/v1/users/${userID}/playlists`;
    let playlistId;
    try {
      const response = await fetch(createPlaylistURL, {
        headers: headers,
        method: "POST",
        body: JSON.stringify({ name: playlistName }),
      });
      if (response.ok) {
        const jsonResponse = await response.json();
        playlistId = jsonResponse.id;
      }
    } catch (error) {
      console.log(error);
    }

    const addSongsURL = `https://api.spotify.com/v1/users/${userID}/playlists/${playlistId}/tracks`;

    try {
      await fetch(addSongsURL, {
        headers: headers,
        method: "POST",
        body: JSON.stringify({ uris: trackURIs }),
      });
    } catch (error) {
      console.log(error);
    }
  },
};
