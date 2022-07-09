const PORT = 8000
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const app = express()
const qs = require('qs')


app.get("/", (req, res) => {
    res.json('Ciao mondo')
})

app.get("/farmacia-aperta/:cap/:d/:h", function (req, res) {
    //indirizzo o cap accettati
    //giorno oggi = 1 domani 2 e cosi via
    //orario 9:00->900 14:30-> 1430 ecc
    const farmacie = [];
    const data = {
        'indirizzo': req.params.cap,
        'giorno': req.params.d,
        'orario': req.params.h
    };
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(data),
        url: "https://www.farmaciediturno.org/ricercaditurno.asp",
    };
    axios(options).then((response) => {
        // usiamo cheerio per gestire il dom più facilmente
        const $ = cheerio.load(response.data)
        // abbiamo tutti i dati necessari, per raggruparli useremo quelli con href =
        const data = $('td.bbo>a');
        let i = 0;
        data.each(function (element, value) {


            //se nel mio oggetto non c'è quella chiave gliela aggiungiamo
            let hrefValue = $(value).attr('href');

            let urlParams = new URLSearchParams(hrefValue.split('asp?')[1])
            let id = urlParams.get('idf')
            if ($(value).html() != "Orario" && $(value).html() != "Mappa" && $(value).html() != "Servizi" && !$(value).html().includes('<img')){
                if (farmacie.length == 0) {
                    i++
                    let info= $(value).html().split('<br>')
                    farmacie.push({
                        id: id,
                        pos: i,
                        nome: info[0].replace('<b>','').replace("</b>",''),
                        via: info[1],
                        citta: info[2].replace('<b>','').replace("</b>",''),
                        telefono: $(value).siblings().find('a').text()
                    });
                    
                }else{
                    for(let j=0;  j< farmacie.length; j++){
                        if(farmacie[j].id == id){
                            farmacie[j].orari = $(value).html();
                            return;
                        }
                    }
                    i++;
                    let info= $(value).html().split('<br>')
                    farmacie.push({
                        id: id,
                        pos: i,
                        nome: info[0].replace('<b>','').replace("</b>",''),
                        via: info[1],
                        citta: info[2].replace('<b>','').replace("</b>",''),
                        telefono: $(value).siblings().find('a').text()
                    });
                }
            }
                
        })
       
        res.json(farmacie)
    });

});

app.listen(PORT)