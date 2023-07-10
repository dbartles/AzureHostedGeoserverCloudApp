# Building a cloud native open source enterprise web GIS
## Full Stack configuration of an open layers based public web map hosted on a Linux VM running cloud native geoserver in Microsoft Azure Cloud

Introduction: This is a guide for users wishing to deploy their own open source enterprise web GIS system with a web front end hosted in the public cloud (Azure). This is not an official guide and is just my personal install notes that may help others. All of the software in this tutorial is free and open source, but hosting on Azure is not free and will require a paid subscription. The cost for the database, server, and public IP addresses could be around 50-100$ monthly if you dont shut down the server when not in use. Note that Azure does provide $200 trial credits to new users that you are likely able to take advantage of. 

 Of course you can deploy this application on other cloud platforms (AWS, Linode, Google Cloud Services), but this guide will show you the particulars of deploying on Azure. 

Background:
You will learn how to spin up your own PostgreSQL database application and configure it with the PostGIS extension and upload GIS layers to it. You will also deploy a Linux Debian Server machine that hosts a containerized version of Geoserver that connects to the database and hosts your layers as Web Map Services (WMS) and Web Feature Services (WFS), and OpenLayers will be the front end web app that provides public access the maps through a browser. Direct connections to the database by the administrator can be made through the QGIS desktop application for data editing. 

NOTE: This guide is for the containerized [cloud native version of Geoserver](http://geoserver.org/geoserver-cloud/), NOT the traditional monolithic servlet application version.  If you are unsure about which type you want to deploy, first do some initial research into what Docker and microservices vs monolithic applications are. You may also want to start with a standard Geoserver deployment to keep things simple. 

This guide will demonstrate a simple deployment with one web server machine configured with a Postgresql/PostGIS database on the same server. This will be designed for relatively low web traffic scenarios with a goal of keeping setup easy and costs low. Depending on your use case, scaling this solution may be necessary. 

## Recommended Skills/Knowledge before you try this:

Below are the basic skills recommended to try this. You do not need more than a basic understanding of each of these concepts, but if you are completely unfamiliar with any of the terms below take some time to research them so you don't get completely lost in this tutorial. I recommend taking the courses that prepare you for the [Azure Fundamentals AZ-900 exam](https://learn.microsoft.com/en-us/certifications/exams/az-900/) and playing around with deploying a few Linux based web servers first before starting this excercize. 

* HTML/javascript/css for basic front-end web coding
* Cloud Services 
* Docker
* Basic SQL database administration (PostGRESQL and PostGIS)
* Virtual machines
* Linux servers
* Networking basics (IP Addresses and ports)
* QGIS Desktop Application (making maps and connecting to databases)
* Web mapping services 
* Basic Bash shell commands (exploring files and folders through the terminal)
* IDE's (e.g. Visual Studio Code)



# What if I get stuck?

You will inevitably run into undocumented errors or issues in a project like this that are not covered in this or other tutorials. You will need to rely on your basic understanding of these technologies simple problem solving to get you out of a bind. I recommend having a Chat GPT session open to ask  questions. Alternatively you can do web searches for any errors or commands you dont understand. Likely other users have encountered simular issues. 



## I dont have the time or skills for this. Is there an easier/quicker way to do something simular?


Yes. If you want to go open source for hosting a web application, private companies can set this all up for you and maintain your servers at a cost. One example is https://lunageo.com/servers/  . 

Another simular application is QGIS Cloud. You can sign up for a free trial or pro subscription to https://qgiscloud.com/ and push your QGIS project directly to the cloud without having to configure all of the project elements and servers in the backend. QGIS. 

There are also many non-open source options for hosting and displaying GIS data online, such as ArcGIS Online, Google Maps, etc. 

 Note: I am not affliated with Luna, QGIS Cloud, ArcGIS Online, or Google Maps in any way. These are just examples and is not a comprehensive list. 



## Proposed Architecture:

This project wil use a single Debian server machine hosted in the Azure cloud to host the web map, database, and web server. The database will be a PostGRESQL 

 There are many possible ways to configure the architecture of this web mapping service, but this will be a good starting point. 

Presumably you would be able to replicate this deployment on a local server or another cloud platform, but these directions will be specific to Microsoft Azure. 

Note: Cloud hosting fees will apply to the Azure  portion of this project, even though all of the software involved is open source. If you shut down your server when not using it you could expect to spend about $5-20 per month while configuring this project.  If you intend to serve this project round the clock to the public the cost could be as much as $100 per month. 

To manage costs ensure that you have your Debian linux server machine configured to auto-shut down every night. Also set up budgets and budget alerts so you know when you are projected to spend more than you want to. Hint: dont set your budget alerts too low, otherwise you will mentally ignore all the emails about your project being over budget and not see when the costs get seriously out of hand. 

![Architecture](/images/ProjectDiagram_geoserver.drawio.png)


# Prerequisite

Sign up for an Azure account and initialize a subscription: https://azure.microsoft.com/en-ca/free/  You will need to be able to enter a credit card to pay for hosted services. Note that the costs involved in this deployment are relatively small, but wise choices will need to be made as far as what types of machines to deploy and if they will be running constantly or only when you need them.

I recommend getting the Azure fundamentals certification (or just reviewing the course material) before starting this tutorial if you are unfamiliar with cloud computing platforms: https://learn.microsoft.com/en-us/certifications/azure-fundamentals/


#

# 1. Prepare your QGIS project on your local machine

* Download QGIS desktop if you do not already have it installed: https://www.qgis.org/en/site/forusers/download.html

Configure a map with the data you'd like to see on it in QGIS. Note that any points, lines, polygons you want to show on the map may need to be transferred later on to the PostGresSQL database that we will deploy in future steps. You can either download someone elses data, or create your own datasets in a local database or shapefile to start. 


# #2 Set up a virtual machine in Azure

Note: Virtual machines, storage, and IP addresses will be billed per hour. It is advised that you review the costs involved, and use best management practices (shutting down the VM when not in use) to minimize your monthly Azure bill. Even with the VM shut down you will be billed for the public IP address and storage volumes associated with this project. If you are eligible, sign up for a free trial of Azure do complete this project at no cost.  

Log into your Azure portal (https://portal.azure.com) and create a new virtual machine resource. Pick **Debian 11 "Bullseye" - x64 Gen2** from the Image drop down list. It is recommended that you pick **Standard_B2s** from the size list.  

For authentication, **SSH public key** is the easiest to manage. Make sure you also allow SSH on inbound ports. 

![Azure Debian VM](/images/AzureVMConfig.png)

On the next page a Sandard SSD drive will serve just fine.

On the networking page create a new virtual network if you do not already have one you want to deploy the machine to. Check the boxes for the default address ranges and subnets.

On the next page acc#pt the default to create a new public IP address. 

On the management page set a auto-shutdown time (you can turn this off once you have deployed a production server).

Accept the rest of the defaults and validate and create the virtual machine. 

When prompted to download the private key go ahead and download it and create the resource. 

Now find the virtual machine in your Azure Portal and start the machine if it is not already running.

# #3 SSH into your VM

Now that your server VM is created and running you will want to use SSH to connect into the server so you can work from inside the machine. 

You will have downloaded the private key (file ending in .pem) from the last step. Copy and paste is from your downloads folder into
```
 ~/.ssh/
```

Then, in the Azure Portal webpage for the VM click "Connect" and click on the "SSH" tab. This will walk you through the following steps. Open a terminal window and type the following to enter the .ssh directory you just pasted the private key .pem file into.

``` 
cd .ssh
````

You can type "ls" to verify that your file is indeed in this folder. 

Then make sure the private key is readonly by entering:
```
chmod 400 <yourkeyname>.pem
```

Now type in the private key path in step 3 in the Azure Portal web browser window. Azure will print out code in step 4 that will allow you to connect to your server using the private key. Copy and paste that code into the command line. You should get a message saying the authenticity of the host cannot be established. Type "yes" to go ahead and continue connecting. 

If you were successfull you will see the server information, and your command prompt will be prefaced with your username on the server @ the server name. You can now enter commands within the server. 


# #4 Set up the VM with the required software

Before you deploy your docker containers with geoserver you will need to install the necessary components on the machine. Start by updating the packages (always good practice when working in Linux):

```
sudo apt update
```


Next you will download and install Java Development Kit 20 (JDK 20) and Apache Maven and update the path variable. Follow these directions: https://www.baeldung.com/install-maven-on-windows-linux-mac

First, Download the JDK
```
wget https://download.oracle.com/java/20/latest/jdk-20_linux-x64_bin.tar.gz
```

Unzip the JDK tarball into folder of your choice (in this example I am using /Maven)

```
sudo tar -xf jdk-20_linux-x64_bin.tar.gz -C /Maven

```

Now download apache maven
```
wget https://dlcdn.apache.org/maven/maven-3/3.9.3/binaries/apache-maven-3.9.3-bin.tar.gz
```

Unzip apache maven into the /Maven folder
```
sudo tar -xf apache-maven-3.9.3-bin.tar.gz -C /Maven
```

Now you need to add Maven to the Environment Path. We do this from .bashrc which is a script file that runs when a user logs in. 

Open the .bashrc file by running:

```
nano ~/.bashrc
```

Then add this text to the file (you can put it at the bottom). Save the file and exit nano. 

```
export M2_HOME=/Maven/apache-maven-3.9.3
export M2=$M2_HOME/bin 
export MAVEN_OPTS=-Xms256m -Mmx512m 
export PATH=$M2:$PATH
```

Now run the .bashrc file to update the environment paths

```
source ~/.bashrc
```


You should be able to run this command to confirm the current version of maven. If this gives you the "mvn: command not found" error most likely you have downloaded the maven files into a different folder than the environment variable for M2_HOME. Note: M2 is just the name for the maven repository directory. 

```
mvn -v
```

Next install docker desktop and docker compose

Follow these directions to install docker-compose:  https://docs.docker.com/compose/install/standalone/


```
sudo curl -SL https://github.com/docker/compose/releases/download/v2.19.1/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
```

```
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

Now give executable permissions to the binary file:

```
sudo chmod +x /usr/local/bin/docker-compose
```

Now check the docker-compose version to make sure it installed:
```
sudo docker-compose --version
```


# #5 Download the Docker-Compose file and start up geoserver containers

The next steps follow these directions: http://geoserver.org/geoserver-cloud/

Now enter the following to download the docker-compose.yml file for Geoserver Cloud. 

```
wget "http://geoserver.org/geoserver-cloud/deploy/docker-compose/stable/shared_datadir/docker-compose.yml"
```

Now fetch the images in the docker-compose file from DockerHub

```
docker-compose pull
```

Next start the docker-compose services
```
sudo docker-compose up -d

```

If the gateway service gives you got an error about the "Range of CPUs is from 0.01 to 2.00.." this is because the docker-compose.yml file specifies 4.0 CPU's for the gateway service but the server you are running it on only has 2 CPUs. You can shut down the services using:

```
sudo docker-compose down
```

Then use nano to edit the docker-compose.yml file to change the cups to 2.0 from 4.0 for that service. After that bring up all of your containers again using:

```
sudo docker-compose --compatibility up -d
```


## Tuning Your Microservices

This section follows the actions documented here: http://geoserver.org/geoserver-cloud/


Give the services a bit of time to start. You can run the following process status command to check on them. Over time they should change status from Up "unhealthy" to Up "healthy. Continue to run the command until all of the services are healthy. 

```
sudo docker-compose ps
```

Geoserver should now be running! If you did this on your local computer you should be able to access the services via a webbrowser, but since there is a firewall blocking the ports on the azure VM you cant quite access it from your external computer. 

Run this command to fetch the web page from the local host. This should print out the associated HTML if it is working

```
curl localhost:9090
```

# #6 Change Firewall Settings to allow browser access from your computer to the GeoServer web interface. 

Go into the azure portal and find your virtual machine. Click Networking and then "Add Inbound Port Rule".

Add port 9090 as the destination port from any port in your IP address. 

![Architecture](/images/NetworkSecurityRule.png)

Now copy the public IP address of the linux server and paste it into a web browser. Add :9090 to the end of the address and press enter.  You should now be accessing the spring eureka system status page that is being hosted by your VM!

If you are familiar with a typical Geoserver application the app should now look the same as it does in a traditional deployment. 

At the moment we do not have our GIS data hosted anywhere so now we will set up the database and come back to Geoserver in a bit. 


# # 6 Configure a PostgreSQL database and PostGIS to host your data

In this step you will configure a PostgreSQL database with the PostGIS extension to serve as your project database.

Go to your Azure Portal and create a new **Azure Database for PostgreSQL** resource. Choose **Flexible Server** as the resource type. Deploy the PostgreSQL Server to the same resource group as your Linux VM that we created in previous steps. 

For authentication you can choose **PostgreSQL authentication only**. 

Put your server in the same region as the other VM, and choose **Development** as the database type to save costs. 

Under security for now just allow your IP address.

Once your database is created and running, use the connect button in Azure Portal to connect to the database. Once you accept the security change to allow for connection to the DB from Portal, a command line interfact will load in Azure Portal with a DB connection - provide the password on the prompt. You are now inside your database and executing commands within it. 

Next, you will install the postgis extension to the database. PostGIS provides spatial data functoinality into a PostGRES database. First, go into the database **server parameters** under the database settings in Azure Portal, and scroll down to azure.extensions and change the value to POSTGIS. This will allow the POSTGIS extension to be enabled on the database. Click Save. 

![enable extension](/images/azureextensions.png)

Now go back to the command line shell in your Azure Portal that is connected to the database and execute the query:

```
CREATE EXTENSION postgres;
```
You now have the postgres extension installed on the database. 


# #7 Configure your GIS data in the database via QGIS


Now we will switch back to our local machine to set up the data from our desktop GIS software (QGIS). If you don't already have QGIS installed, Windows, Linux, and Mac versions can be downloaded for free. Alternatively you can also connect to the database through ArcGIS if you prefer, but the directions below are for QGIS. 

 Open your GIS Project on your local machine. Initiate a new connection to your new Azure Postgresql database in QGIS by right clicking on PostGIS in the Browser, and creating a new connection. Fill in the connection info from your Azure PostGRESQL database and provide the database username and password when prompted.

 ![PostGIS Extension](/images/PostGISConnection.png)

Use the DB manager to directly upload your project data into your postgresql server database: https://opengisgal.wordpress.com/2017/04/14/qgis-db-manager-uploading-data-to-postgis/

Configure your project and make sure that the old local versions of the datasources are no longer added to the project and that the project layers are referencing the postgresql server database. 

Your data shuld now be available by connecting to your PostGIS database that is hosted in azure. Test this out in QGIS. 

Finally, you must allow for your PostGreSQL database to allow connections from the IP address of your Linux VM that holds the docker containers. Go into your Azure Portal and navigate to your database, under Networking add a new firewall rule to allow connections from the IP address of your Linux VM. 

# #8 Configure GeoServer to host Web Feature Services of your data

Now we will set up geoserver to pull in the data in our PostGRESQL database and host our GIS data as a web feature service. A web feature service (WFS) is a standard layer format that will be consumable by a wide variety of web and desktop GIS applications. In this case we will consume it through an OpenLayers web front end, but people worldwide will be able to connect to the service once hosted in Geoserver. We will generally be following the documentation for using the GeoServer web administration interface at this site: https://docs.geoserver.org/latest/en/user/gettingstarted/web-admin-quickstart/index.html

Go to your web browser and connect to the public ip address linux VM that you set up earlier at port 9090.

Login using the default login (user: admin  password: geoserver). It is recommended that you change this password after logging in. 

Now follow the directions under "creating a new workspace" to publish your PostGIS layer: https://docs.geoserver.org/latest/en/user/gettingstarted/postgis-quickstart/index.html

Navigate on the left hand menu bar to Data-->Workspaces. give the workspace a name and then a URI (note, you can put geoserver.org as the domain even though that will not be where the layer is accessed)

In this example I will be hosting trail map data so my workspace is named "trails" and my URI is "http://geoserver.org/trails". Note that you can also use the geoserver.org domain name here. 

Now navigate to Data-->Stores and click "Add New Store.  Find PostGIS Database under the vector sources link. 

Choose the workspace you last created. Put the data source name as the PostGIS layer file you created in QGIS, and put in a description of the layer. 

Go to your PostGRESQL connection information in QGIS and fill it out here. My connection is set up as below.

Make sure the SSL mode is set to Enabled.

![layer connection info](/images/LayerConnectionSettings.png)


Once your store is added, navigate to Layers. Add a new layer from the store you created. All of the available layers in the database should show up as options. Choose a layer and give it a description and title. Add the bounding boxes based on the data and save the layer. 

You should now be able to click "Layer Preview" to generate images of your layers! 


# # 9 Build the web frontend for your map

We will now navigate to Open Layers to build our web front end of the map. You can build the page on your local machine to make things more simple and deploy to the production server once you have happy with it. 

Follow the directions here to build a simple app. The commands on the first line can be executed from your local terminal, or from within a terminal window in an IDE like Visual Studio Code or VS Codium: 

https://openlayers.org/doc/quickstart.html

Enter the following code into the terminal. And paste the resulting URL in a browser. You should see a simple mapping app hosted on your local machine. If you dont have npm (node package manager) installed on your computer first run:

```
npm install -g npm
```

Now initiate the app by entering the code below line by line into your terminal. 

```
npm create ol-app my-app
cd my-app
npm start
```

Now in your IDE (VSCode or VSCodium) open the javascript file main.js You will be adding the connection to your particular WMS layer into the map so it can connect to it. 

First, add this at the top to allow the map to read a TileWMS file:
```JS
import TileWMS from 'ol/source/TileWMS.js';
```

Next, you will be adding another layer into the Map code for the new map within main.js. Enter the code below into the existing OSM tile layer. Note: this example shows the URL to my map service, yours will be different.  You will want to go into your geoserver WMS get capabilities and copy the url for your service from there. 

Dont forget to also change the layer name. 

As long as you have ran "npm start" in the terminal and clicked on the url provided, as soon as you save the javascript the html file should reload with your changes. If you did not make any errors the map should load with your layer. 

```JS
    new TileLayer({
    source: new TileWMS({
      url: 'http://13.64.141.70:9090/ows?service=WMS',
      params: {'LAYERS': 'trails:CDT', 'TILED': true},
      serverType: 'geoserver',
      // Countries have transparency, so do not fade tiles:
      transition: 0,
    }),
  }),
```

Under the view you can change the zoom level and centre coordinates of the map. Note that the coordinates are not in lat long, but in web mercator. I was able to get a map centred on the western united states with these settings. Note that there are coodinate conversion scripts in open layers that allow for quick translation. 

```JS
    center: [-12000000, 4500000],
    zoom: 5
```

You can also edit your text or css of the webpage to customize as you desire. 

Once you are happy with your page there is only one last step - to serve it up on your web server!

Through the terminal within your project folder (probably within VS Code) you will just have to have node build the application. This will place an HTML file and associated assets within the dist folder:

```
npm run build
```

## 10 Set up your server machine to server the web content

To serve web pages we will use nginx. On your Azure Debian linux machine install nginx

```
sudo apt install nginx
```

To test to ensure that nginx is installed and running, see if your access this URL it will bring back a page:

```
curl localhost:80
```

Nginx serves up the index.html file in /var/www/html/ by default. This can be changed in the server settings. In this example we will place our dist folder at this location and delete the default nginx page.


## 11 Deploy the web app on a web server

Now make a folder to store your web page on the azure server. You will make it in the root directory:

```
cd /
sudo mkdir data
cd data
sudo mkdir www
cd www
```

No


Now you have to copy your code from the dist folder to your web server. You can accomplish this using scp. From a terminal on your local machine run this to copy the dist directory to your cloud server through ssh. 

```
scp -r /home/user/dist azureuser@13.64.141.70:/data/www
```

Note: If you have trouble doing this with scp due to public key permissions, a work around is to upload the code to github and make it public and then pull it down from github in the terminal on your azure machine using:

```
git clone github.com/username/myapp.git
```
You should now have your index.html and the assets folder under /data/www on your Azure machine. 

Now you have to configure the nginx configuration file to read those files. You can now go and change the settings of the sites-enabled and the sites-available files are in this config file if you'd like.

Note that etc/nginx/sites-available/default is meant to be a larger collection of all draft sites and possible options, and etc/nginx/sites-enabled/default is only the sites you have enabled.

To edit the sites-enabled folder, open up the configuration file:

```
sudo nano /etc/nginx/sites-enabled/default
```

In the config file make sure that this line (line 41) is reading your root web directory:

```
root /data/www;
```
Then below that on line 44 just have it read your index.html file (or replace that with whatever your home page file name if yours is different)

```
index index.html;
```

Save and exit your changes to that file. Now restart nginx to make sure your changes take effect.


```
sudo systemctl restart nginx
```

Finally check to see if your map page is now accessible from the local machine on port 80. You should see your html from your map setup here if sucessful

```
curl localhost:80
```


## 12 Configure network security rules

In this final section you will expose your web map to the public internet or particular IP addresses you wish to allow to view the data. 

Go into the Azure Portal and configure a new networking port rule. Either add any source IP or your IP to be able to access destination port 80. 

You should now be able to go into your browser on your local computer and copy the Linux VM IP address and paste it into your browser with ":80" to the end of it. 

If everything is working you should now see your map with the data! If you cant see your map layers but can see the rest of the map, make sure your docker containers are started and healthy with:

```
sudo docker-compose ps
```

My map looks like this when I load it:

![Architecture](/images/FinalMap.png)

**Congratulations!** That brings us to the end of this lesson. You now have seen under the hood of the full stack of open source technologies and tied them all together to create a functional web mapping service and all underlying components. 

There is much more to do if you are building a full robust enterprise system, like improve the web page, assign your custom domain name, tweak security settings and passwords, etc, but you now have learned how to build the full stack of technology that can enable enterprise grade mapping.

I hope to explore some additional functionalities in future projects. For example, like how to build a [GeoNode](https://geonode.org/) site to manage your web GIS content, or how to collect data through mobile applications using [QField](https://qfield.org)

-Devin Bartley
