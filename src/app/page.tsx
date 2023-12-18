'use client'

import { Box, Container, Stack, Text } from '@chakra-ui/react'

export default function Home() {
  return (
    <Box as="section" py={{ base: '4', md: '8' }}>
      <Container maxW="3xl">
        <Box bg="bg.surface" boxShadow="sm" borderRadius="lg" p={{ base: '4', md: '6' }}>
          <Stack spacing="5">
            <Stack spacing="1">
              <Text textStyle="lg" fontWeight="medium">
                Autopilot
              </Text>
              <Text textStyle="sm" color="fg.muted">
                This is the first Chakra UI element
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
