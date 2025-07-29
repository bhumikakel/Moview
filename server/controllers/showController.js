import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req,res)=>{
  try{
    const {data} = await axios.get('https://api.themoviedb.org/3/movie/now_playing',{
       params: { api_key: process.env.TMDB_API_KEY },
    

    })
    const movies = data.results;
    res.json({success:true, movies:movies})
  }catch(error) {
    console.log(error);
    res.json({success:false, message:error.message})
    
  }
}

// API to add a new show to the database
export const addShow = async(req,res)=>{
  try{
    console.log(req.body);
    const {movieId , showsInput , showPrice} = req.body;
    let movie = await Movie.findById(movieId)

    if(!movie){
      // Fetch movie details and credits from TMDB
      const [movieDetailsResponse,movieCreditsResponse]=await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`,{
       params: { api_key: process.env.TMDB_API_KEY },
    
    }),
    axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`,{
       params: { api_key: process.env.TMDB_API_KEY },
   
    })
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id : movieId,
        title:movieApiData.title,
        overview:movieApiData.overview,
        poster_path:movieApiData.poster_path,
        backdrop_path:movieApiData.backdrop_path,
        genres:movieApiData.genres,
        casts:movieCreditsData.cast,
        release_date:movieApiData.release_date,
        original_language:movieApiData.original_language,
        tagline:movieApiData.tagline || "",
        vote_average:movieApiData.vote_average,
        runtime:movieApiData.runtime,
      }

      //Add movie to the database
      movie = await Movie.create(movieDetails)
      
}

const showsToCreate = [];
showsInput.forEach(show =>{
  const showDate =show.date;
  show.time.forEach((time)=>{
    const dateTimeString = `${showDate}T${time}`;
    const istDate = new Date(dateTimeString);

    // Convert IST to UTC by subtracting 5.5 hours
    const utcTimestamp = istDate.getTime() - (5.5 * 60 * 60 * 1000);
    const utcDate = new Date(utcTimestamp);

    showsToCreate.push({
      movie:movieId,
      showDateTime:utcDate,
      showPrice,
      occupiedSeats:{}
    })
  })
});
if(showsToCreate.length > 0){
  await Show.insertMany(showsToCreate)
}

// Trigger Inngest Function
await inngest.send({
  name:"app/show.added",
  data:{movieTitle:movie.title}
})
res.json({success:true,message:'Show Added Successfully'})


  } catch(error){
    console.log(error);
    res.json({success:false, message:error.message})
  }
}

// API to get all shows from the databasse
export const getShows = async(req,res)=>{
  try{
    const shows = await Show.find({showDateTime:{$gte : new Date()}}).populate('movie').sort({showDateTime : 1});

    //filter unique shows
    const uniqueShows = new Set(shows.map(show => show.movie))

    res.json({success:true, shows:shows})
  }catch(error){
    console.log(error);
    res.json({success:false, message:error.message})
    
  }
}

// API to get single show from database
export const getShow =async(req,res)=>{
  try{
    const {movieId}=req.params;
    // get all upcoming shows for the movie
    const shows=await Show.find({movie:movieId,showDateTime:{$gte :new Date()}})

    const movie =await Movie.findById(movieId);
    const dateTime = {}
    shows.forEach((show)=>{
      const date =show.showDateTime.toISOString().split("T")[0];

      if(!dateTime[date]){
        dateTime[date]=[]
      }
      dateTime[date].push({time:show.showDateTime,showId:show._id})
    })
    res.json({success:true, movie,dateTime})
  }catch(error){
    res.json({success:false, message:error.message})
  }
}