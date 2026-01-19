# Wearable System for Interlimb Asymmetry Detection
(ESP32-C3, C/C++, FreeRTOS, I²C, ADC, Wi-Fi, Firebase, TypeScript, React, FastAPI)
<br>

- Detects and quantifies interlimb asymmetries by analyzing acceleration, angular velocity, and force of movements.
- Integrates IMU and FSR sensors to capture kinematic and kinetic data.
- ESP32-C3 MCU handles I²C and ADC interfacing, real-time data acquisition, and Wi-Fi transmission.
- Implements FreeRTOS tasks to sample data, upload it to the cloud, and monitor the recording state, employing a mutex to share a circular buffer across tasks.
- Sensor data is stored in a Firebase Realtime Database.
- A FastAPI (Python) backend retrieves this data, applies signal filtering and computes asymmetry indices using NumPy, and streams the results to the frontend through a WebSocket.
- The results are displayed in a dashboard interface built with React, TypeScript, and Tailwind CSS, using Recharts to display live plots of sensor data.



<br>
<p align="center">
<img width="1512" height="821" alt="image" src="https://github.com/user-attachments/assets/53a62d47-2b65-46b6-bcfb-bfcf7b3b002c" />
<br>
  <em>Fig. 1: Dashboard Interface with Real-time Data Table </em>
</p><br>

 


<p align="center">
<img width="1512" height="821" alt="image" src="https://github.com/user-attachments/assets/c967280b-5ad7-4f7a-bb7f-873377f371dd" />
<br>
  <em>Fig. 2: Dashboard Interface with Real-time Plots</em>
</p><br>



<p align="center">
<img width="700" height="764" alt="image" src="https://github.com/user-attachments/assets/fbc0543d-5bf9-4dd8-8f39-3dfd9694cd70" />
<br>
  <em>Fig. 3: Device Components and Enclosure Features </em>
</p><br>


<p align="center">
<img width="900" height="281" alt="image" src="https://github.com/user-attachments/assets/8cf80a89-a078-4014-9371-c363290d6877" />
<br>
  <em>Fig. 4: Fig. 4: Top and Bottom Views of the 4-Layer PCB </em>
</p><br>

<p align="center">
<img width="900" height="521" alt="image" src="https://github.com/user-attachments/assets/4e353265-96f8-4eea-b802-aa1139f960bc" />

<br>
  <em>Fig. 5: Enclosure Design Features </em>
</p><br>

<p align="center">
<img width="1512" height="750" alt="image" src="https://github.com/user-attachments/assets/d9462f62-b20f-4eb1-913a-4129fa56cf77" />
<br>
  <em>Fig. 6: Circuit Diagram</em>
</p><br>






 




