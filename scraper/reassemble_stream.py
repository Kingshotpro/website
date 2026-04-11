import struct

def get_stream(pcap_path, direction='IN'):
    with open(pcap_path, 'rb') as f:
        magic = f.read(4)
        if not magic: return
        endian = '<' if magic[0] == 0xd4 else '>'
        global_hdr = f.read(20)
        if len(global_hdr) < 20: return
        ver_maj, ver_min, tz, sigfigs, snaplen, linktype = struct.unpack(endian + 'HHiIII', global_hdr)
        ip_offset_b = 20 if linktype == 276 else 14
        t0 = None
        while True:
            hdr = f.read(16)
            if len(hdr) < 16: break
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack(endian + 'IIII', hdr)
            data = f.read(incl_len)
            ts = ts_sec + ts_usec / 1e6
            if t0 is None: t0 = ts
            rel_ts = ts - t0
            if len(data) < ip_offset_b + 20 + 20: continue
            ip_data = data[ip_offset_b:]
            if (ip_data[0] >> 4) != 4: continue
            ip_hlen = (ip_data[0] & 0xf) * 4
            if len(ip_data) < ip_hlen + 20: continue
            if ip_data[9] != 6: continue
            tcp_data = ip_data[ip_hlen:]
            if len(tcp_data) < 20: continue
            src_port = struct.unpack('>H', tcp_data[0:2])[0]
            dst_port = struct.unpack('>H', tcp_data[2:4])[0]
            tcp_hlen = ((tcp_data[12] >> 4) & 0xf) * 4
            payload = tcp_data[tcp_hlen:]
            if not payload: continue
            if direction == 'IN' and src_port == 30101:
                yield rel_ts, payload
            elif direction == 'OUT' and dst_port == 30101:
                yield rel_ts, payload

def get_full_stream(pcap_path, direction='IN'):
    full_data = bytearray()
    index = []
    current_offset = 0
    for rel_ts, payload in get_stream(pcap_path, direction):
        full_data.extend(payload)
        index.append((rel_ts, current_offset, len(payload)))
        current_offset += len(payload)
    return bytes(full_data), index
