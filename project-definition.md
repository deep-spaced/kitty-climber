# Kitty Climber

A 2-dimensional side scrolling platformer game.

Style is similar to Super Mario World, Rayman, or Celeste.

## Gameplay

Health bar with four hits.
Health is replinished by eating cat treats.
Cat treats are randomly scattered around the level.
Cat treats are dropped randomly when rats are defeated.
Rats are defeated in 1-3 hits.


## Characters

Protagonist: a mama cat called Edith. She has four kittens that are missing after they ran away to go hide on Mount Twitchy.
She is tabby-colored.

Enemies: rats wearing black masks. They attack by scratching and biting (two separate animations).

## Goal

Find the kittens. They are randomly hidden on Mount Twitchy.

## Scenario

Mount Twitchy: a white-capped mountain with two peaks. The mountain has tunnels throughout it.
These tunnels are the main levels for the game.

## Level Select / Map View

After starting the game, the level select or map view is shown first.
This is a picture of a mountain with the four levels shown as spots on the map with a line between them. The levels can only be chosen once they are defeated.

## Levels

There are a total of four tunnels, one tunnel per level.
Each tunnel is hidden on the map view until the area is explored.
Each level is dynamically generated when the player enters the level.

The kittens are in cages hidden at the end of each level. Once the kitten is released the level is over.
Kittens are released by attacking the cage.

Obstacles in the levels:
- Falling rocks
- Ledges
- Moving boards across pits

### Level 1

Base of the mountain.

### Level 2

First peak.

### Level 3

Tallest peak

### Level 4

The far side of the mountain.

## End Game

When all the kittens are found, a disco balls drops from the ceiling and everyone starts dancing.

## Controls

- Movement: left/right arrow keys
- Jump: press `x`.
- Attack: press `c` to scratch and `z` to bite.
- Crouch: `v` (ducks under rat attacks and goes into small caves)
- Map view: `m` (shows an overview of the level discovered so far)

## Tech

This is a web-based game built in Javascript and leveraging React.

Include test coverage.

