use("spotify")

db.tracks.find({
  "audio_features.danceability": { $gt: 0.7 },
  "audio_features.energy": { $gt: 0.7 },
  duration_ms: { $gte: 180000, $lte: 300000 }
})
    .sort({ popularity: -1 })   // найкращі за популярністю зверху
    .limit(50);


db.tracks.aggregate([
  {
    $match: {
      popularity: { $gte: 60 }  // спочатку відбираємо тільки популярні треки
    }
  },
  { $unwind: "$artists" },  // розгортаємо масив артистів
  {
    $group: {
      _id: "$artists",
      trackCount: { $sum: 1 },
      minPopularity: { $min: "$popularity" },
      avgPopularity: { $avg: "$popularity" },
      totalPopularity: { $sum: "$popularity" }
    }
  },
  {
    $match: {
      trackCount: { $gte: 3 },      // мінімум 3 треки
      minPopularity: { $gte: 60 }   // мінімальна популярність ≥ 60
    }
  },
  {
    $project: {
      artist: "$_id",
      trackCount: 1,
      avgPopularity: { $round: ["$avgPopularity", 1] },
      minPopularity: { $round: ["$minPopularity", 1] }
    }
  },
  { $sort: { trackCount: -1, avgPopularity: -1 } }, // топ за кількістю, потім за середньою популярністю
  { $limit: 20 }
]);


db.tracks.aggregate([
  {
    $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      stdDev_tempo: { $stdDevPop: "$audio_features.tempo" },
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      genre: "$_id",
      avg_tempo: { $round: ["$avg_tempo", 2] },
      stdDev_tempo: { $round: ["$stdDev_tempo", 2] },
      outlier_threshold: {
        $round: [
          { $add: ["$avg_tempo", { $multiply: ["$stdDev_tempo", 2] }] },
          2
        ]
      }
    }
  },
  {
    $lookup: {
      from: "tracks",
      let: {
        genre: "$genre",
        threshold: "$outlier_threshold"
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$track_genre", "$$genre"] },
                { $gt: ["$audio_features.tempo", "$$threshold"] }
              ]
            }
          }
        },
        {
          $project: {
            track_id: 1,
            track_name: 1,
            artists: 1,
            popularity: 1,
            duration_sec: 1,
            tempo: "$audio_features.tempo",
            track_genre: 1
          }
        },
        { $sort: { "audio_features.tempo": -1 } }
      ],
      as: "outlier_tracks"
    }
  },
  {
    $project: {
      genre: 1,
      avg_tempo: 1,
      outlier_threshold: 1,
      outlier_tracks: 1,
      outlier_count: { $size: "$outlier_tracks" }
    }
  },
  { $sort: { outlier_count: -1, avg_tempo: -1 } }
]);


db.tracks.find({
  "audio_features.loudness": { $lt: -10 },
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
  explicit: false
})
.sort({ popularity: -1 })          // найпопулярніші зверху
.limit(50);
