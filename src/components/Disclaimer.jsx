import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Disclaimer = () => {
  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography>Tietoja palvelusta</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography align='left'>
          Tämä sovellus esittää Oittaan hiihtoladun kävijätilannetietoa. Kaikki tieto on Espoon kaupungin kaupungin ylläpitämällä tutkasensorilla kerättyä ja haettu laitevalmistaja <a href='https://my.sensmax.eu/r/294212'>SensMaxin palvelusta</a>.
          <br/>Sovelluksen tarkoitus on helpottaa tietojen tulkintaa tarjoamalla kattavammin eri esitysvaihtoehtoja.
        </Typography>
      </AccordionDetails>
    </Accordion>
  )
}

export default Disclaimer