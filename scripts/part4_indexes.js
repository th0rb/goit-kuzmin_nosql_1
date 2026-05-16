use("spotify")

db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).toArray();

/*
.explain()

winningPlan: {
      isCached: false,
      stage: 'SORT',
      sortPattern: {
        popularity: NumberInt('-1')
      },
      memLimit: NumberInt('33554432'),
      type: 'simple',
      inputStage: {
        stage: 'COLLSCAN',
        filter: {
          $and: [
            {
              track_genre: {
                $eq: 'pop'
              }
            },
            {
              'audio_features.danceability': {
                $gte: Double('0.7')
              }
            }
          ]
        },
        direction: 'forward'
      }
    }
*/

db.tracks.createIndex({
  track_genre: 1,
  "audio_features.danceability": 1,
  popularity: -1
}, { name: "idx_genre_danceability_popularity" });

/*

winningPlan: {
      isCached: false,
      stage: 'FETCH',
      inputStage: {
        stage: 'SORT',
        sortPattern: {
          popularity: NumberInt('-1')
        },
        memLimit: NumberInt('33554432'),
        type: 'default',
        inputStage: {
          stage: 'IXSCAN',
          keyPattern: {
            track_genre: NumberInt('1'),
            'audio_features.danceability': NumberInt('1'),
            popularity: NumberInt('-1')
          },
          indexName: 'idx_genre_danceability_popularity',
          isMultiKey: false,
          multiKeyPaths: {
            track_genre: [],
            'audio_features.danceability': [],
            popularity: []
          },
          isUnique: false,
          isSparse: false,
          isPartial: false,
          indexVersion: NumberInt('2'),
          direction: 'forward',
          indexBounds: {
            track_genre: [
              '["pop", "pop"]'
            ],
            'audio_features.danceability': [
              '[0.7, inf.0]'
            ],
            popularity: [
              '[MaxKey, MinKey]'
            ]
          }
        }
      }
    }

*/

db.tracks.createIndex({
  explicit: 1,
  "audio_features.speechiness": 1,
  "audio_features.instrumentalness": 1
}, { 
  name: "idx_work_music_instrumental_speechiness" 
});

// Приклад запиту для фонової музики під час роботи
db.tracks.find({
  explicit: false,
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 }
}).explain("executionStats");

/*

winningPlan: {
      isCached: false,
      stage: 'FETCH',
      inputStage: {
        stage: 'IXSCAN',
        keyPattern: {
          explicit: NumberInt('1'),
          'audio_features.speechiness': NumberInt('1'),
          'audio_features.instrumentalness': NumberInt('1')
        },
        indexName: 'idx_work_music_instrumental_speechiness',
        isMultiKey: false,
        multiKeyPaths: {
          explicit: [],
          'audio_features.speechiness': [],
          'audio_features.instrumentalness': []
        },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: NumberInt('2'),
        direction: 'forward',
        indexBounds: {
          explicit: [
            '[false, false]'
          ],
          'audio_features.speechiness': [
            '[-inf.0, 0.1)'
          ],
          'audio_features.instrumentalness': [
            '(0.5, inf.0]'
          ]
        }
      }
    },

    executionStages: {
      isCached: false,
      stage: 'FETCH',
      nReturned: NumberInt('16141'),
      executionTimeMillisEstimate: NumberInt('40'),
      works: NumberInt('16921'),
      advanced: NumberInt('16141'),
      needTime: NumberInt('779'),
      needYield: NumberInt('0'),
      saveState: NumberInt('2'),
      restoreState: NumberInt('2'),
      isEOF: NumberInt('1'),
      docsExamined: NumberInt('16141'),
      alreadyHasObj: NumberInt('0'),
      inputStage: {
        stage: 'IXSCAN',
        nReturned: NumberInt('16141'),
        executionTimeMillisEstimate: NumberInt('18'),
        works: NumberInt('16921'),
        advanced: NumberInt('16141'),
        needTime: NumberInt('779'),
        needYield: NumberInt('0'),
        saveState: NumberInt('2'),
        restoreState: NumberInt('2'),
        isEOF: NumberInt('1'),
        keyPattern: {
          explicit: NumberInt('1'),
          'audio_features.speechiness': NumberInt('1'),
          'audio_features.instrumentalness': NumberInt('1')
        },
        indexName: 'idx_work_music_instrumental_speechiness',
        isMultiKey: false,
        multiKeyPaths: {
          explicit: [],
          'audio_features.speechiness': [],
          'audio_features.instrumentalness': []
        },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: NumberInt('2'),
        direction: 'forward',
        indexBounds: {
          explicit: [
            '[false, false]'
          ],
          'audio_features.speechiness': [
            '[-inf.0, 0.1)'
          ],
          'audio_features.instrumentalness': [
            '(0.5, inf.0]'
          ]
        },
        keysExamined: NumberInt('16921'),
        seeks: NumberInt('780'),
        dupsTested: NumberInt('0'),
        dupsDropped: NumberInt('0')
      }
    }

*/
