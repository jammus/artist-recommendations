# Overview
Generates a list of artists you should checkout based on what your friends have been listening to.

## Setup
Rename config.js.example to config.js and enter the correct api_key.

## Usage
`node artist-recommendations.js [name]` where name is the username of the Last.fm user to generate recommendations for.

## How it works
The script aggregates the top artists of the user's friends from the last 3 months. It then picks the first 10 (ordered by total number of plays) that the user has never listened to.

## To-do
* Add weighting based on friend compatibility.
