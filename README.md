# Automated CI/CD Pipeline for Express.js Deployment Using GitHub Actions and Self-Hosted Runners

To implement this CI/CD pipeline using GitHub Actions, we'll go through the process step-by-step. We'll start with setting up a basic Express server and GitHub repository, then move on to configuring the GitHub Actions workflow to deploy the service via SSH from runner server to nodejs server.

![alt text](./image-2.jpg)


## 1. Create a new Repository and two AWS EC2 Instances

- Go to your github account and create a new repository for the express server.
- Login to AWS account and create a two new instance. One for runner server and one for nodejs express server. Allow http access from security group inbound rules to the express server instance, so that we can see it form our browser.  

## 2. Set up a basic Express server locally

First, let's create a simple Express server:

```bash
mkdir express-service
cd express-service
npm init -y
npm install express
```

Create a file named `app.js` with the following content:

```javascript
const express = require('express');
const app = express();
const port = 5000;

app.get('/', (req, res) => {
  res.send('Hello World! Express server is running on port 5000.');
});

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
```

<!-- ## 2. Set up GitHub repository

Initialize a Git repository and push it to GitHub:

```bash
git init
echo "node_modules/" > .gitignore
git add .
git commit -m "Initial commit"
``` -->

<!-- Create a new repository on GitHub and follow the instructions to push your local repository. -->

## 3. Configure GitHub Actions workflow

Create a `.github/workflows` directory in your project and add a file named `main.yml`:

```yaml
name: Deploy Express Service

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Deploy to Express service instance
        env:
          PRIVATE_KEY: ${{ secrets.EXPRESS_SERVER_SSH_PRIVATE_KEY }}
          HOST: ${{ secrets.EXPRESS_SERVER_HOST }}
        run: |
          echo "$PRIVATE_KEY" > private_key.pem
          chmod 600 private_key.pem
          
          # Ensure SSH and SCP are available
          which ssh-agent || ( apt-get update -y && apt-get install openssh-client -y )
          which scp || ( apt-get update -y && apt-get install openssh-client -y )
          
          eval $(ssh-agent -s)
          ssh-add private_key.pem
          
          # Create directory and copy files
          ssh -o StrictHostKeyChecking=no $HOST "mkdir -p ~/express-service"
          scp -o StrictHostKeyChecking=no -r ./* $HOST:~/express-service/
          
          # Run commands on remote server
          ssh -o StrictHostKeyChecking=no $HOST '
            cd ~/express-service
            npm ci
            pm2 describe app > /dev/null
            if [ $? -eq 0 ]; then
              pm2 restart app
            else
              pm2 start app.js --name app
            fi
          '
          
          rm -f private_key.pem
```

This GitHub Actions workflow automates the deployment of an Express.js application. Here's a brief explanation:

1. It triggers on pushes to the main branch.

2. It runs on a self-hosted runner (likely your EC2 instance with the GitHub runner installed).

3. The workflow:
   - Checks out the code from the repository.
   - Sets up the SSH private key for secure connection.
   - Ensures SSH and SCP are available on the runner.
   - Creates a directory on the target server for the Express service.
   - Copies all files from the repository to the target server.
   - On the target server, it:
     - Installs dependencies (npm ci)
     - Checks if the app is already running in PM2
     - If running, restarts it; if not, starts it

4. It uses two secrets:
   - **EXPRESS_SERVER_SSH_PRIVATE_KEY:** The SSH private key for connecting to the target server.
   - **EXPRESS_SERVER_HOST:** The username and hostname/IP of the target server.

This workflow allows you to automatically deploy your Express.js application to your target server whenever you push changes to the main branch of your GitHub repository.



## 4. Set up GitHub Secrets

In your GitHub repository, go to Settings > Secrets and add the following secrets:

- `EXPRESS_SERVER_SSH_PRIVATE_KEY`: The private SSH key for connecting to the Express service instance. It should be like:
    ```
    -----BEGIN RSA PRIVATE KEY-----
    ...................................
    ...................................
    ...................................
    -----END RSA PRIVATE KEY-----
    ```

- `EXPRESS_SERVER_HOST`: The hostname or IP address of the Express service instance. In our case: 
    ```
    ubuntu@54.236.22.144
    ```


## 5. Configure the self-hosted runner

1. **SSH into EC2 Instance**:
    - Go to your runner server instance and click on `connect`.
    - Open terminal and navigate to the directory with your PEM file.
    - Use the SSH command provided by AWS to connect. We used windows powershell to SSH into EC2 Instance.

        ![alt text](https://github.com/Minhaz00/NodeJS-Tasks/blob/main/14.%20Deploy%20Express%20App%20in%20EC2%20Using%20Github%C2%A0Action/images/image-3.png?raw=true)


1. **Create and activate the runner**:
    - Go to your repository’s settings on GitHub.
    - Under “Actions”, click “Runners” and add a new self-hosted runner for Linux.

        ![alt text](https://github.com/Minhaz00/NodeJS-Tasks/blob/main/14.%20Deploy%20Express%20App%20in%20EC2%20Using%20Github%C2%A0Action/images/image-4.png?raw=true)

    - Follow the commands provided to set up the runner on your EC2 instance.

        ![alt text](https://github.com/Minhaz00/NodeJS-Tasks/blob/main/14.%20Deploy%20Express%20App%20in%20EC2%20Using%20Github%C2%A0Action/images/image-5.png?raw=true)

        You will get something like this after the final command (marked portion):

        ![alt text](https://github.com/Minhaz00/NodeJS-Tasks/blob/main/14.%20Deploy%20Express%20App%20in%20EC2%20Using%20Github%C2%A0Action/images/image-6.png?raw=true)

        After that, keep hitting `Enter` to continue with the default settings. Now if you go to the **github repository** > **settings** > **runners**, you will get something like this:

        ![alt text](https://github.com/Minhaz00/NodeJS-Tasks/blob/main/14.%20Deploy%20Express%20App%20in%20EC2%20Using%20Github%C2%A0Action/images/image-7.png?raw=true)

        It is in offline state. Go to the SSH PowerShell and use the following command:

        ```bash
        sudo ./svc.sh install
        sudo ./svc.sh start
        ```

        Now the runner in the github repository is no more in Offline state:

        ![alt text](https://github.com/Minhaz00/NodeJS-Tasks/blob/main/14.%20Deploy%20Express%20App%20in%20EC2%20Using%20Github%C2%A0Action/images/image-8.png?raw=true)




## 6. Install necessary tools on the Express service instance

SSH into the Express service instance and install Node.js, npm, and PM2:

```bash
sudo apt update
sudo apt install nodejs npm
sudo npm install -g pm2
```

## 7. Push changes and test the workflow

Make a change to your Express service, commit, and push to GitHub:

```bash
git add .
git commit -m "Update Express service"
git push origin main
```

This will trigger the GitHub Actions workflow, which will:

1. Run on your self-hosted runner (EC2 instance with the runner)
2. Check out the code
3. Install dependencies
4. Use SSH to copy the files to the Express service instance
5. SSH into the Express service instance to install dependencies and restart the service using PM2

## 8. Verification

Now if we visit `http://<express-service-public-ip>:5000` , We will see the express service is up and running:

![alt text](image.png)

Let's change the express service code and verify the auto deployment:

Open `App.js` in your IDE and change the code for `/` endpoint:

```js
const express = require('express');
const app = express();
const port = 5000;

app.get('/', (req, res) => {
  res.send('We did it!');
});

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
```

Now push it to github:

```
git add .
git commit -m "Endpoint changed"
git push
```

Now if we visit `http://<express-service-public-ip>:5000` , We will see the express service is up and running and the message has been changed:

![alt text](image-1.png)