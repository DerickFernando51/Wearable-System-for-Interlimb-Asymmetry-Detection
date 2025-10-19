# Wearable System for Interlimb Asymmetry Detection
(ESP32-C3, C/C++, I²C, ADC, Wi-Fi, Firebase, TypeScript, React, FastAPI)
<br>

- A real-time wearable system to detect and quantify interlimb asymmetry by analyzing acceleration, angular velocity, and force of movement.   
- Integrates Inertial Measurement Unit (IMU) and Force Sensitive Resistor (FSR) sensors to capture kinematic and kinetic data. 
- Firmware on the ESP32-C3 (C/C++) manages I²C and ADC interfacing, real-time data acquisition, and wireless transmission over Wi-Fi.
- Implements sensor calibration, noise filtering, and synchronization to ensure accurate and reliable measurements.
- The sensor data is stored in a Firebase Realtime Database.
- A FastAPI (Python) backend retrieves this data, applies signal filtering and computes asymmetry indices using NumPy, and streams the results to the frontend dashboard through a WebSocket.
- The dashboard interface is built with React, TypeScript, and Tailwind CSS, using Recharts for real-time visualization of sensor data




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
<img width="930" height="266" alt="image" src="https://github.com/user-attachments/assets/46d4cd88-d016-42aa-a38e-811f857eac94" />
<br>
  <em>Fig. 3: Wearable Device Components and Assembly Process </em>
</p><br>

<p align="center">
<img width="853" height="266" alt="image" src="https://github.com/user-attachments/assets/1e6d6f4e-d36a-431c-926f-b73449584d83" />
<br>
  <em>Fig. 4: Overall Device Components with Side and Front Views of the Wearable on Foot </em>
</p>


