<br/>
<p align="center">
  <a href="https://github.com/ICEatm/pm2-monitor">
    <img src="https://raw.githubusercontent.com/Unitech/pm2/development/pres/pm2-v4.png" alt="Logo" width="350" height="80">
  </a>

  <h3 align="center">PM2 - Process Montior</h3>

  <p align="center">
    This application checks the restart counter of your pm2 processes. If a process has restarted X amount of times it sends a status mail.
    <br/>
    <br/>
  </p>
</p>

![Contributors](https://img.shields.io/github/contributors/ICEatm/pm2-monitor?color=dark-green) ![Stargazers](https://img.shields.io/github/stars/ICEatm/pm2-monitor?style=social) 

## Table Of Contents
- [Table Of Contents](#table-of-contents)
- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Authors](#authors)

## About The Project
![Screen Shot](https://i.imgur.com/lLKejPQ.png)
<p align="center">
<img src="https://i.imgur.com/4iRcym0.jpeg" alt="Screenshot" width="350" height="500">
</p>

This project implements a monitoring tool using Node.js to oversee various processes managed by PM2. It checks the health of specified processes at regular intervals, detecting if any process has restarted beyond a defined threshold. If the number of restarts surpasses the threshold, it triggers an alert via email using Nodemailer. The tool utilizes configuration files to manage process details and email settings. This simple yet effective monitoring tool helps in maintaining the stability and health of managed processes.

## Built With
* [TypeScript](https://www.typescriptlang.org/)
* [Nodemailer](https://nodemailer.com/)
* [PM2](https://pm2.keymetrics.io/)

## Getting Started
This project aims to provide a streamlined monitoring solution for Node.js processes managed by PM2. It includes configurations to set up monitoring intervals, restart thresholds, and email alerts. Clone the repository, configure the settings in config/default.json, and start the application to initiate process monitoring.

### Prerequisites
Before getting started with this project, ensure that you have:

- Node.js: The project relies on Node.js for its runtime environment. You can download and install it from the official Node.js website.

### Installation
To install and set up the project, follow these steps:

- Clone the Repository: Use `git clone` to copy the project to your local machine.
- Navigate to the Project Directory: Use cd to move into the project folder.
- Install Dependencies: Run `npm install` to install all necessary dependencies required for the project.

## Usage
Before starting the application, run `npm run build` to build the project. After the build process, customize the configuration settings in config/default.json to match your requirements and ensure the specified processes align with those you intend to monitor. Start the application with `npm run start` to initiate the monitoring process

## Authors
* **ICEatm** - *Developer* - [ICEatm](https://github.com/ICEatm)