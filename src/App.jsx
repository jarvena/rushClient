import { useState, useEffect } from 'react'
import './App.css'

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { BarChart } from '@mui/x-charts/BarChart';

import logService from './services/logService'
import { AppBar, Box, Paper, Slider, Switch, Toolbar, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Disclaimer from './components/Disclaimer';
import dayjs from 'dayjs';
import 'dayjs/locale/fi';

import {proptypes} from 'prop-types';

const parseLog = (log) => {
  return log.map(item => {
    return parseInt(item.counterValue.N)
  })
}

const parseLogTimestamps = (log) => {
  return log.map(item => {
    return parseInt(item.timestamp.N)
  })
}

const accumulationToChange = (array) => {
  return array.slice(1).map((item, index) => {
    const out = item - array[index]
    if (out < 0) {
      if (array[index+2] >= array[index]) { // Naive SensMax log inconsistency handling
        return 0
      }
      return item
    }
    return out
  })
}

const aggregateArray = (arr, factor) => {
  return arr.reduce((acc, curr, index) => {
    const groupIndex = Math.floor(index / factor);
    if (!acc[groupIndex]) {
      acc[groupIndex] = 0;
    }
    acc[groupIndex] += curr;
    return acc;
  }, []);
}

const createArrayWithRadius = (radius) => {
  const result = [];
  // Ascending part
  for (let i = 1; i <= radius+1; i++) {
    result.push(i);
  }
  // Descending part
  for (let i = radius; i >= 1; i--) {
    result.push(i);
  }
  return result;
}

const arrayElementMultiplication = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return 0
  }
  return arr1.reduce((total, item, index) => {
    return total + item * arr2[index]
  }, 0)
}

const arrayElementSum = (arr) => {
  return arr.reduce((total, item) => {
    return total + item
  })
}

const currentTime = () => {
  //return 1732425159
  return Math.floor(new Date().getTime() / 1000)
}

const smoothen = (array, radius=1) => {
  const filter = createArrayWithRadius(radius);
  const filterSum = arrayElementSum(filter) //filter.reduce((total, item) => {return total + item})
  return array.map((item, index) => {
    if (index < radius) {
      return arrayElementMultiplication(filter.slice(radius-index), array.slice(0, index+radius+1)) / arrayElementSum(filter.slice(radius-index)) //(2*item + array[index+1]) / 3
    } else if (index + radius > array.length - 1) {
      return arrayElementMultiplication(filter.slice(0, radius-index+array.length), array.slice(index-radius)) / arrayElementSum(filter.slice(0, radius-index+array.length))//(2*item + array[index-1]) / 3
    }
    return arrayElementMultiplication(filter, array.slice(index-radius, index+radius+1)) / filterSum
  })
}

const weekDayFromUnixTime = (unixTime) => {
  const date = new Date(unixTime * 1000)
  return date.getDay()
}

const buildDayStats = (log) => {
  const dayLog = log.filter(item => {
    const isSameWeekday = weekDayFromUnixTime(parseInt(item.timestamp.N) + 5*60) === new Date(currentTime()*1000).getDay() // include extra item for AccToChange conversion
    const isWithin24h = currentTime() - item.timestamp.N < 86400
    return isSameWeekday && isWithin24h
  })
  const dayStats = accumulationToChange(parseLog(dayLog))
  const paddedDayStats = dayStats.concat(new Array(288 - dayStats.length).fill(0))
  return paddedDayStats
}

const ComparisonView = ({data, referenceData, setReferenceData}) => {
  const [resolution, setResolution] = useState(12)
  const [referenceLabel, setReferenceLabel] = useState('')
  const dayData = aggregateArray(buildDayStats(data), resolution)
  const referenceDayData = referenceData.length > 0 ? aggregateArray(accumulationToChange(parseLog(referenceData)), resolution) : []

  const handleDateChange = (date) => {
    setReferenceLabel(date ? date.format('D.M.YYYY') : '')
    date ? logService.getLogInterval(date.unix() - 60*5, date.unix()+60*60*24).then(res => {
        setReferenceData(res.data)
      })
      : setReferenceData([])
  }

  const handleResolutionChange = (event, value) => {
    const resolutionMap = {
      0: 1,
      1: 2,
      2: 3,
      3: 6,
      4: 12,
    }
    setResolution(resolutionMap[value])
  }

  return (
    <Box margin={2}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Paper sx={{pl: 2}}>
            <Typography variant="subtitle1">Päivätilanne</Typography>
              <BarChart
                series={referenceDayData.length > 0 ? [{data: dayData, label: 'Tänään'}, {data: referenceDayData, label: referenceLabel}] : [{data: dayData, label: 'Tänään'}]}
                height={500}
                yAxis={[{label:'Hiihdetyt kierrokset'}]}
              />
          </Paper>
        </Grid>
        <Grid container spacing={3} size={12} alignItems={'center'} justifyContent={'center'}>
          <Grid size={4} sx={{minWidth: 150}}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'fi'}>
              <DatePicker
                label="verrokkipäivä"
                onChange={handleDateChange}
                slotProps={{
                  field: {
                    clearable: true
                  }
                }}
                maxDate={dayjs().subtract(1, 'day')}
                minDate={dayjs(new Date(2023, 10, 1))}
              />
            </LocalizationProvider>
          </Grid>
          <Grid size={8}>
            <Typography id="input-slider" gutterBottom>
              Aikatarkkuus
            </Typography>
            <Slider
              track={false}
              onChange={handleResolutionChange}
              defaultValue={4}
              marks={[
                {
                  value: 0,
                  label: '5 min',
                },
                {
                  value: 1,
                  label: '10 min',
                },
                {
                  value: 2,
                  label: '15 min',
                },
                {
                  value: 3,
                  label: '30 min',
                },
                {
                  value: 4,
                  label: '1 h',
                }
              ]}
              max={4}
            />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [theme, setTheme] = useState('dark')
  const [rawData, setRawData] = useState([])
  const [referenceRawData, setReferenceRawData] = useState([])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    logService.getLogInterval(currentTime() - 60*60*24, currentTime()).then(res => setRawData(res.data))
  }, []);
  
  return (
    <>
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
    <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h5" component="div" >
            Oittaan hiihtäjätilanne
          </Typography>
          <div style={{flex: 1}} />
          <Typography variant="button" component="div" >
            Tumma tila
          </Typography>
          <Switch defaultChecked onChange={toggleTheme} />
        </Toolbar>
      </AppBar>
      <ComparisonView data={rawData} referenceData={referenceRawData} setReferenceData={setReferenceRawData}/>
      <Disclaimer />
      </ThemeProvider>
    </>
  )
}

export default App
