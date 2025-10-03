################################################################################
#
# File:     network_scanner.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    For scanning the network for devices.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from scapy.all import ARP, Ether, srp
import configuration as c                                                       #Import application configuration variables
from logger import logi, logw, loge                                             #Import logging functions
import socket

connected_devices = []

################################################################################
#
#   @brief  Scans the network using ARP requests.
#   @return list                Dictionary list of connected network devices
#
################################################################################
def get_connected_devices():
    global connected_devices

    arp = ARP(pdst=c.NETWORK_IP_RANGE)                                          #Create ARP packet
    ether = Ether(dst="ff:ff:ff:ff:ff:ff")                                      #Create the Ether broadcast packet ff:ff:ff:ff:ff:ff MAC address indicates broadcasting
    packet = ether/arp                                                          #Stack them

    result = srp(packet, timeout=5, retry=1, verbose=0)[0]

    connected_devices = []
    for sent, received in result:
        try:
            hostname = socket.gethostbyaddr(received.psrc)[0]
        except socket.herror:
            hostname = received.psrc                                            #Hostname cannot be resolved, use IP

        connected_devices.append({
            "ip_address": received.psrc,
            "mac_address": received.hwsrc,
            "hostname": hostname
        })

    print("IP" + " "*18+"Hostname")
    for device in connected_devices:
        print("{:16}    {}".format(device["ip_address"], device["hostname"]))
    
    return connected_devices

################################################################################
#
#   @brief  Returns the MAC address of the specified IP address.
#   @param  ip_address          IP address of the device
#   @return string              MAC address
#
################################################################################
def get_mac_address(ip_address):
    #Look in connected devices
    for device in connected_devices:
        if device["ip_address"] == ip_address:
            return device["mac_address"]
        
    #Not found in connected devices, try to send an individual request
    arp_req = ARP(pdst=ip_address)
    ether = Ether(dst="ff:ff:ff:ff:ff:ff")
    packet = ether/arp_req
    result = srp(packet, timeout=2, retry=1, verbose=0)[0]

    if result:
        return result[0][1].hwsrc
    
    return None