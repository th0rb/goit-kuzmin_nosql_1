use("spotify")

db.tracks.aggregate([
  { $unwind: "$artists" },                    // розгортаємо масив артистів
  
  {
    $group: {
      _id: "$artists",                        // групуємо по виконавцю
      trackCount: { $sum: 1 },
      avgPopularity: { $avg: "$popularity" }
    }
  },
  {
    $match: {
      trackCount: { $gte: 5 }                 // мінімум 5 треків
    }
  },
  {
    $project: {
      artist: "$_id",
      avgPopularity: { $round: ["$avgPopularity", 1] },   // округлення до 1 знака
      trackCount: 1
    }
  },
  { $sort: { avgPopularity: -1 } },           // сортування за спаданням
  { $limit: 10 }
]);

db.tracks.aggregate([
  {
    $group: {
      _id: "$track_genre",
      trackCount: { $sum: 1 },
      avg_danceability: { $avg: "$audio_features.danceability" },
      avg_energy: { $avg: "$audio_features.energy" },
      avg_valence: { $avg: "$audio_features.valence" }
    }
  },
  {
    $match: {
      trackCount: { $gte: 100 }        // тільки жанри з достатньою кількістю треків
    }
  },
  {
    $project: {
      genre: "$_id",
      avg_danceability: { $round: ["$avg_danceability", 3] },
      avg_energy: { $round: ["$avg_energy", 3] },
      avg_valence: { $round: ["$avg_valence", 3] },
      trackCount: 1
    }
  },
  {
    $addFields: {
      dance_score: { 
        $round: [
          { $divide: [
            { $add: ["$avg_danceability", "$avg_energy", "$avg_valence"] }, 
            3 
          ]}, 
          3
        ]
      }
    }
  },
  { $sort: { dance_score: -1, avg_danceability: -1 } },   // найкращі для танців зверху
  { $limit: 15 }
]);

