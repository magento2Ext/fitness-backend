 const express = require("express");
 const router = express.Router()
 const Theme = require('../models/theme_setting')

 require('../functions')
 


router.post('/all/themes', async(req,res) => {
    try{
		const themes = await Theme.find()
        response = webResponse(201, true, themes)  
		res.send(response)
		return "";
    }catch(err){
        res.send('Error ' + err)
		return "";
    }
})
 module.exports = router