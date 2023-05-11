import { extendTheme } from "@chakra-ui/react"

const theme = extendTheme({
  styles: {
    global: {
      "body": {
        backgroundColor: "red.800",
      }
    }
  }
})

export default theme;