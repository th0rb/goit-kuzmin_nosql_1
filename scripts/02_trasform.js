use("spotify")

const source = db.getCollection("tracks_raw");
const target = db.getCollection("tracks");

print("Starting transformation...");

// Drop target collection to start fresh
target.drop();

const pipeline = [
  {
    $project: {
      track_id: 1,
      track_name: 1,
      album_name: 1,
      explicit: { $toBool: "$explicit" },
      popularity: { $toInt: "$popularity" },
      duration_ms: { $toInt: "$duration_ms" },
      track_genre: 1,
      
      // Split artists into clean array
      artists: {
        $map: {
          input: { 
            $split: [{ $ifNull: ["$artists", ""] }, ";"] 
          },
          as: "artist",
          in: { $trim: { input: "$$artist" } }
        }
      },
      
      // Audio features as nested object
      audio_features: {
        danceability: { $toDouble: "$danceability" },
        energy: { $toDouble: "$energy" },
        loudness: { $toDouble: "$loudness" },
        speechiness: { $toDouble: "$speechiness" },
        acousticness: { $toDouble: "$acousticness" },
        instrumentalness: { $toDouble: "$instrumentalness" },
        liveness: { $toDouble: "$liveness" },
        valence: { $toDouble: "$valence" },
        tempo: { $toDouble: "$tempo" },
        key: { $toInt: "$key" },
        mode: { $toInt: "$mode" },
        time_signature: { $toInt: "$time_signature" }
      },
      
      // Duration in seconds (rounded UP)
      duration_sec: {
        $ceil: { $divide: [{ $toDouble: "$duration_ms" }, 1000] }
      },
      
      // Popularity tier
      popularity_tier: {
        $switch: {
          branches: [
            { case: { $gte: [{ $toInt: "$popularity" }, 70] }, then: "high" },
            { case: { $gte: [{ $toInt: "$popularity" }, 40] }, then: "medium" }
          ],
          default: "low"
        }
      }
    }
  },
];

// Run the transformation
source.aggregate([...pipeline, { $out: "tracks" }]);

print("✅ Transformation completed successfully!");
print("Total documents: " + db.tracks.countDocuments({}))
